import type { Journal, JournalStatus } from '../platform/types/ledger'
import type { ServiceContext } from '../platform/types/core'
import { checkSoDViolation } from '../platform/types/permissions'
import { AuditService } from '../platform/services/audit.service'
import { LedgerEngine, generateId } from './ledger.engine'

// ─── Approval workflow state machine ─────────────────────────────────────────
// draft → submitted → pending_approval → approved → posted
// Any state → rejected → draft (with comment)

export type ApprovalAction = 'submit' | 'approve' | 'reject' | 'post' | 'retract'

export interface ApprovalTransition {
  from: JournalStatus
  action: ApprovalAction
  to: JournalStatus
  requiresApprover: boolean
  requiresSoD: boolean
}

export const APPROVAL_TRANSITIONS: ApprovalTransition[] = [
  { from: 'draft', action: 'submit', to: 'pending_approval', requiresApprover: false, requiresSoD: false },
  { from: 'pending_approval', action: 'approve', to: 'approved', requiresApprover: true, requiresSoD: true },
  { from: 'pending_approval', action: 'reject', to: 'rejected', requiresApprover: true, requiresSoD: false },
  { from: 'rejected', action: 'submit', to: 'pending_approval', requiresApprover: false, requiresSoD: false },
  { from: 'approved', action: 'post', to: 'posted', requiresApprover: false, requiresSoD: false },
  { from: 'draft', action: 'retract', to: 'draft', requiresApprover: false, requiresSoD: false },
  { from: 'pending_approval', action: 'retract', to: 'draft', requiresApprover: false, requiresSoD: false },
]

export interface ApprovalResult {
  success: boolean
  journal: Journal | null
  error: string | null
}

export interface ApproverConfig {
  userId: string
  entityIds: string[] // empty = all entities
  maxAmount?: number
  requiresDual?: boolean
}

// In-memory approver configuration
const _approvers: Map<string, ApproverConfig[]> = new Map()

export class ApprovalEngine {
  /**
   * Get valid next actions for a journal given the current user.
   */
  static getAvailableActions(journal: Journal, userId: string): ApprovalAction[] {
    const actions: ApprovalAction[] = []

    for (const transition of APPROVAL_TRANSITIONS) {
      if (transition.from !== journal.status) continue

      if (transition.action === 'submit' || transition.action === 'retract') {
        if (journal.preparedBy === userId) actions.push(transition.action)
      } else if (transition.action === 'approve' || transition.action === 'reject') {
        // Approver cannot be preparer (SoD)
        if (journal.preparedBy !== userId) actions.push(transition.action)
      } else if (transition.action === 'post') {
        actions.push(transition.action)
      }
    }

    return actions
  }

  /**
   * Submit a journal for approval.
   */
  static async submitJournal(
    journalId: string,
    ctx: ServiceContext,
    services: { audit: typeof AuditService },
  ): Promise<ApprovalResult> {
    const journal = LedgerEngine.getJournal(journalId)
    if (!journal) return { success: false, journal: null, error: `Journal ${journalId} not found` }

    if (journal.preparedBy !== ctx.userId) {
      return { success: false, journal: null, error: 'Only the preparer can submit a journal' }
    }

    if (journal.status !== 'draft' && journal.status !== 'rejected') {
      return { success: false, journal: null, error: `Cannot submit a journal in ${journal.status} status` }
    }

    const now = new Date().toISOString()
    const updated: Journal = {
      ...journal,
      status: 'pending_approval',
      submittedAt: now,
    }
    LedgerEngine.storeJournal(updated)

    await services.audit.log(ctx, 'journal.submitted', {
      sourceModule: journal.sourceModule,
      resourceType: 'journal',
      resourceId: journalId,
      description: `Journal ${journal.reference} submitted for approval`,
      beforeState: { status: journal.status },
      afterState: { status: 'pending_approval' },
    })

    return { success: true, journal: updated, error: null }
  }

  /**
   * Approve a journal.
   */
  static async approveJournal(
    journalId: string,
    ctx: ServiceContext,
    services: { audit: typeof AuditService },
  ): Promise<ApprovalResult> {
    const journal = LedgerEngine.getJournal(journalId)
    if (!journal) return { success: false, journal: null, error: `Journal ${journalId} not found` }

    if (journal.status !== 'pending_approval') {
      return { success: false, journal: null, error: `Cannot approve a journal in ${journal.status} status` }
    }

    // SoD check: preparer cannot approve
    const sodViolation = checkSoDViolation(journal.preparedBy, ctx.userId)
    if (sodViolation) {
      return { success: false, journal: null, error: sodViolation.description }
    }

    const now = new Date().toISOString()
    const updated: Journal = {
      ...journal,
      status: 'approved',
      approvedBy: ctx.userId,
      approvedAt: now,
    }
    LedgerEngine.storeJournal(updated)

    await services.audit.log(ctx, 'journal.approved', {
      sourceModule: journal.sourceModule,
      resourceType: 'journal',
      resourceId: journalId,
      description: `Journal ${journal.reference} approved by ${ctx.userId}`,
      beforeState: { status: 'pending_approval' },
      afterState: { status: 'approved', approvedBy: ctx.userId, approvedAt: now },
    })

    return { success: true, journal: updated, error: null }
  }

  /**
   * Reject a journal — sends back to draft with a comment.
   */
  static async rejectJournal(
    journalId: string,
    reason: string,
    ctx: ServiceContext,
    services: { audit: typeof AuditService },
  ): Promise<ApprovalResult> {
    const journal = LedgerEngine.getJournal(journalId)
    if (!journal) return { success: false, journal: null, error: `Journal ${journalId} not found` }

    if (journal.status !== 'pending_approval') {
      return { success: false, journal: null, error: `Cannot reject a journal in ${journal.status} status` }
    }

    if (journal.preparedBy === ctx.userId) {
      return { success: false, journal: null, error: 'Preparer cannot reject their own journal' }
    }

    if (!reason || reason.trim().length === 0) {
      return { success: false, journal: null, error: 'A rejection reason is required' }
    }

    const now = new Date().toISOString()
    const updated: Journal = {
      ...journal,
      status: 'rejected',
      rejectedBy: ctx.userId,
      rejectedAt: now,
      rejectionReason: reason,
    }
    LedgerEngine.storeJournal(updated)

    await services.audit.log(ctx, 'journal.rejected', {
      sourceModule: journal.sourceModule,
      resourceType: 'journal',
      resourceId: journalId,
      description: `Journal ${journal.reference} rejected — ${reason}`,
      beforeState: { status: 'pending_approval' },
      afterState: { status: 'rejected', rejectedBy: ctx.userId, reason },
    })

    return { success: true, journal: updated, error: null }
  }

  /**
   * Retract a journal back to draft (only the preparer can do this).
   */
  static async retractJournal(
    journalId: string,
    ctx: ServiceContext,
    _services: { audit: typeof AuditService },
  ): Promise<ApprovalResult> {
    const journal = LedgerEngine.getJournal(journalId)
    if (!journal) return { success: false, journal: null, error: `Journal ${journalId} not found` }

    if (!['draft', 'pending_approval', 'rejected'].includes(journal.status)) {
      return { success: false, journal: null, error: `Cannot retract a journal in ${journal.status} status` }
    }

    if (journal.preparedBy !== ctx.userId) {
      return { success: false, journal: null, error: 'Only the preparer can retract a journal' }
    }

    const updated: Journal = { ...journal, status: 'draft' }
    LedgerEngine.storeJournal(updated)

    return { success: true, journal: updated, error: null }
  }

  static registerApprover(tenantId: string, config: ApproverConfig): void {
    const existing = _approvers.get(tenantId) ?? []
    const idx = existing.findIndex((a) => a.userId === config.userId)
    if (idx >= 0) existing[idx] = config
    else existing.push(config)
    _approvers.set(tenantId, existing)
  }

  static getApprovers(tenantId: string): ApproverConfig[] {
    return _approvers.get(tenantId) ?? []
  }

  static canUserApprove(tenantId: string, userId: string, entityId: string, amount: number): boolean {
    const approvers = this.getApprovers(tenantId)
    const config = approvers.find((a) => a.userId === userId)
    if (!config) return false
    if (config.entityIds.length > 0 && !config.entityIds.includes(entityId)) return false
    if (config.maxAmount !== undefined && amount > config.maxAmount) return false
    return true
  }

  static createJournal(
    params: Omit<Journal, 'id' | 'status' | 'preparedAt' | 'submittedAt' | 'approvedBy' | 'approvedAt' | 'rejectedBy' | 'rejectedAt' | 'rejectionReason' | 'postedBy' | 'postedAt' | 'reversedBy' | 'reversedAt' | 'reversalJournalId' | 'originalJournalId' | 'attachments'>,
  ): Journal {
    const journal: Journal = {
      ...params,
      id: generateId(),
      status: 'draft',
      preparedAt: new Date().toISOString(),
      submittedAt: null,
      approvedBy: null,
      approvedAt: null,
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,
      postedBy: null,
      postedAt: null,
      reversedBy: null,
      reversedAt: null,
      reversalJournalId: null,
      originalJournalId: null,
      attachments: [],
    }
    LedgerEngine.storeJournal(journal)
    return journal
  }
}
