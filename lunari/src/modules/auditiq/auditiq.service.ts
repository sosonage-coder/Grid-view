import type { ServiceContext } from '../../platform/types/core'
import { generateId } from '../../engine/ledger.engine'
import type { PBCItem, AuditEvidence, EvidenceVaultFilter } from './types'

const _pbcItems: Map<string, PBCItem> = new Map()
const _evidenceItems: Map<string, AuditEvidence> = new Map()

;(function seed() {
  const items: PBCItem[] = [
    { id: 'pbc-001', tenantId: 'tenant-acme', entityId: 'entity-us', auditPeriod: '2024', category: 'Revenue', requestNumber: 'PBC-001', title: 'Revenue recognition schedules', description: 'Provide ASC 606 revenue recognition schedules for all active contracts in FY2024', requestedBy: 'user-auditor', requestedAt: '2025-01-05T09:00:00Z', dueDate: '2025-01-20', assignedTo: 'user-accountant', status: 'in_progress', priority: 'urgent', evidence: [], comments: [], relatedAccountIds: ['acc-4010', 'acc-4020', 'acc-4030'], notes: null, resolvedAt: null, createdAt: '2025-01-05T09:00:00Z', updatedAt: '2025-01-08T10:00:00Z' },
    { id: 'pbc-002', tenantId: 'tenant-acme', entityId: 'entity-us', auditPeriod: '2024', category: 'Cash & Bank', requestNumber: 'PBC-002', title: 'Bank reconciliations Dec 2024', description: 'Provide signed bank reconciliations for all bank accounts as of December 31, 2024', requestedBy: 'user-auditor', requestedAt: '2025-01-05T09:00:00Z', dueDate: '2025-01-15', assignedTo: 'user-accountant', status: 'submitted', priority: 'high', evidence: [], comments: [{ id: 'cmt-001', pbcItemId: 'pbc-002', authorId: 'user-accountant', authorName: 'Maria Rodriguez', content: 'Uploaded bank recon for all 4 accounts. Operating and payroll accounts reconciled to zero difference.', isAuditorComment: false, createdAt: '2025-01-12T14:00:00Z' }], relatedAccountIds: ['acc-1010', 'acc-1011', 'acc-1012'], notes: null, resolvedAt: null, createdAt: '2025-01-05T09:00:00Z', updatedAt: '2025-01-12T14:00:00Z' },
    { id: 'pbc-003', tenantId: 'tenant-acme', entityId: 'entity-us', auditPeriod: '2024', category: 'Fixed Assets', requestNumber: 'PBC-003', title: 'Fixed asset roll-forward', description: 'Provide fixed asset roll-forward schedule with acquisitions, disposals, and depreciation for FY2024', requestedBy: 'user-auditor', requestedAt: '2025-01-05T09:00:00Z', dueDate: '2025-01-22', assignedTo: 'user-accountant', status: 'open', priority: 'high', evidence: [], comments: [], relatedAccountIds: ['acc-1600', 'acc-1601'], notes: null, resolvedAt: null, createdAt: '2025-01-05T09:00:00Z', updatedAt: '2025-01-05T09:00:00Z' },
    { id: 'pbc-004', tenantId: 'tenant-acme', entityId: 'entity-us', auditPeriod: '2024', category: 'Accounts Payable', requestNumber: 'PBC-004', title: 'AP aging and completeness', description: 'Provide AP aging report as of Dec 31 and confirm all invoices received before year-end are accrued', requestedBy: 'user-auditor', requestedAt: '2025-01-05T09:00:00Z', dueDate: '2025-01-18', assignedTo: 'user-ap-clerk', status: 'accepted', priority: 'normal', evidence: [], comments: [{ id: 'cmt-002', pbcItemId: 'pbc-004', authorId: 'user-auditor', authorName: 'External Auditor', content: 'Evidence accepted. No exceptions noted.', isAuditorComment: true, createdAt: '2025-01-14T11:00:00Z' }], relatedAccountIds: ['acc-2010'], notes: null, resolvedAt: '2025-01-14T11:00:00Z', createdAt: '2025-01-05T09:00:00Z', updatedAt: '2025-01-14T11:00:00Z' },
    { id: 'pbc-005', tenantId: 'tenant-acme', entityId: 'entity-us', auditPeriod: '2024', category: 'Leases', requestNumber: 'PBC-005', title: 'IFRS 16 / ASC 842 lease schedules', description: 'Provide lease schedule roll-forward for all leases subject to ASC 842', requestedBy: 'user-auditor', requestedAt: '2025-01-05T09:00:00Z', dueDate: '2025-01-25', assignedTo: 'user-accountant', status: 'open', priority: 'high', evidence: [], comments: [], relatedAccountIds: ['acc-1500', 'acc-2100'], notes: null, resolvedAt: null, createdAt: '2025-01-05T09:00:00Z', updatedAt: '2025-01-05T09:00:00Z' },
  ]
  for (const item of items) _pbcItems.set(item.id, item)
})()

export class AuditIQService {
  static async getPBCItems(ctx: ServiceContext, auditPeriod?: string): Promise<PBCItem[]> {
    let items = Array.from(_pbcItems.values()).filter((i) => i.tenantId === ctx.tenantId && i.entityId === ctx.entityId)
    if (auditPeriod) items = items.filter((i) => i.auditPeriod === auditPeriod)
    return items.sort((a, b) => a.requestNumber.localeCompare(b.requestNumber))
  }

  static async getPBCItem(ctx: ServiceContext, id: string): Promise<PBCItem> {
    const item = _pbcItems.get(id)
    if (!item || item.tenantId !== ctx.tenantId) throw new Error('PBC item not found')
    return item
  }

  static async submitEvidence(ctx: ServiceContext, pbcItemId: string, data: Omit<AuditEvidence, 'id' | 'pbcItemId' | 'tenantId' | 'entityId' | 'reviewedBy' | 'reviewedAt' | 'status' | 'rejectionReason' | 'createdAt'>): Promise<AuditEvidence> {
    const evidence: AuditEvidence = { id: generateId(), pbcItemId, tenantId: ctx.tenantId, entityId: ctx.entityId, reviewedBy: null, reviewedAt: null, status: 'submitted', rejectionReason: null, createdAt: new Date().toISOString(), ...data }
    _evidenceItems.set(evidence.id, evidence)
    const item = _pbcItems.get(pbcItemId)
    if (item) {
      const updated = { ...item, status: 'submitted' as const, evidence: [...item.evidence, evidence], updatedAt: new Date().toISOString() }
      _pbcItems.set(pbcItemId, updated)
    }
    return evidence
  }

  static async getEvidenceVault(ctx: ServiceContext, filter: EvidenceVaultFilter = {}): Promise<AuditEvidence[]> {
    let items = Array.from(_evidenceItems.values()).filter((e) => e.tenantId === ctx.tenantId && e.entityId === ctx.entityId)
    if (filter.status) items = items.filter((e) => e.status === filter.status)
    if (filter.evidenceType) items = items.filter((e) => e.evidenceType === filter.evidenceType)
    if (filter.search) {
      const s = filter.search.toLowerCase()
      items = items.filter((e) => e.title.toLowerCase().includes(s) || e.description.toLowerCase().includes(s))
    }
    return items
  }

  static async addComment(ctx: ServiceContext, pbcItemId: string, content: string, isAuditorComment = false): Promise<PBCItem> {
    const item = await this.getPBCItem(ctx, pbcItemId)
    const comment = { id: generateId(), pbcItemId, authorId: ctx.userId, authorName: ctx.userId, content, isAuditorComment, createdAt: new Date().toISOString() }
    const updated = { ...item, comments: [...item.comments, comment], updatedAt: new Date().toISOString() }
    _pbcItems.set(pbcItemId, updated)
    return updated
  }
}
