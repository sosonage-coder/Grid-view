import type { Journal, JournalLine, ValidationResult, PostingResult, GLBalance } from '../platform/types/ledger'
import type { ServiceContext } from '../platform/types/core'
import { AuditService } from '../platform/services/audit.service'

// ─── ID generator ─────────────────────────────────────────────────────────────

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

// ─── In-memory GL store (dev) ─────────────────────────────────────────────────

const _journals: Map<string, Journal> = new Map()
const _balances: Map<string, GLBalance> = new Map()

// ─── Platform services interface ──────────────────────────────────────────────

export interface PlatformServices {
  audit: typeof AuditService
  getPeriodStatus: (periodId: string) => Promise<'open' | 'closed' | 'locked'>
  getAccountActive: (accountId: string) => Promise<boolean>
}

// ─── LedgerEngine ────────────────────────────────────────────────────────────

export class LedgerEngine {
  /**
   * Validates that a journal's lines balance (sum debits == sum credits).
   * Also checks for empty lines, zero amounts, and missing accounts.
   */
  static validateDoubleEntry(lines: JournalLine[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (!lines || lines.length === 0) {
      errors.push('Journal must have at least two lines')
      return { isValid: false, errors, warnings, totalDebit: 0, totalCredit: 0, difference: 0 }
    }

    if (lines.length < 2) {
      errors.push('Journal must have at least two lines for double-entry')
    }

    let totalDebit = 0
    let totalCredit = 0
    let totalFunctionalDebit = 0
    let totalFunctionalCredit = 0

    for (const line of lines) {
      if (!line.accountId) {
        errors.push(`Line ${line.sequence}: account is required`)
      }
      if (line.debit < 0 || line.credit < 0) {
        errors.push(`Line ${line.sequence}: amounts cannot be negative`)
      }
      if (line.debit === 0 && line.credit === 0) {
        warnings.push(`Line ${line.sequence}: both debit and credit are zero`)
      }
      if (line.debit > 0 && line.credit > 0) {
        errors.push(`Line ${line.sequence}: a line cannot have both debit and credit`)
      }
      if (line.fxRate <= 0) {
        errors.push(`Line ${line.sequence}: FX rate must be positive`)
      }

      totalDebit += line.debit
      totalCredit += line.credit
      totalFunctionalDebit += line.functionalDebit
      totalFunctionalCredit += line.functionalCredit
    }

    // Round to avoid floating-point drift
    totalDebit = Math.round(totalDebit * 100) / 100
    totalCredit = Math.round(totalCredit * 100) / 100
    totalFunctionalDebit = Math.round(totalFunctionalDebit * 100) / 100
    totalFunctionalCredit = Math.round(totalFunctionalCredit * 100) / 100

    const difference = Math.round((totalDebit - totalCredit) * 100) / 100
    const functionalDifference = Math.round((totalFunctionalDebit - totalFunctionalCredit) * 100) / 100

    if (Math.abs(difference) > 0.005) {
      errors.push(
        `Journal does not balance: debits ${totalDebit.toFixed(2)} ≠ credits ${totalCredit.toFixed(2)} (diff ${difference.toFixed(2)})`,
      )
    }

    if (Math.abs(functionalDifference) > 0.005) {
      errors.push(
        `Functional currency journal does not balance: difference ${functionalDifference.toFixed(2)}`,
      )
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      totalDebit,
      totalCredit,
      difference,
    }
  }

  /**
   * Posts a journal: validates, checks period lock, updates GL balances, writes audit.
   */
  static async postJournal(
    journal: Journal,
    services: PlatformServices,
  ): Promise<PostingResult> {
    const errors: string[] = []

    // 1. Validate double-entry
    const validation = this.validateDoubleEntry(journal.lines)
    if (!validation.isValid) {
      return {
        success: false,
        journalId: journal.id,
        postedAt: '',
        balancesUpdated: 0,
        auditEventId: '',
        errors: validation.errors,
      }
    }

    // 2. Check period lock
    const periodStatus = await services.getPeriodStatus(journal.periodId)
    if (periodStatus === 'locked') {
      errors.push(`Period ${journal.periodId} is locked — posting is not permitted`)
    }
    if (periodStatus === 'closed') {
      errors.push(`Period ${journal.periodId} is closed — reopen before posting`)
    }

    // 3. Check all accounts are active
    for (const line of journal.lines) {
      const active = await services.getAccountActive(line.accountId)
      if (!active) {
        errors.push(`Account ${line.accountCode} (${line.accountId}) is inactive`)
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        journalId: journal.id,
        postedAt: '',
        balancesUpdated: 0,
        auditEventId: '',
        errors,
      }
    }

    // 4. Apply to GL balances
    const postedAt = new Date().toISOString()
    let balancesUpdated = 0

    for (const line of journal.lines) {
      const balanceKey = `${journal.tenantId}:${line.entityId}:${line.accountId}:${journal.periodId}`
      const existing = _balances.get(balanceKey)

      if (existing) {
        existing.periodDebit = Math.round((existing.periodDebit + line.functionalDebit) * 100) / 100
        existing.periodCredit = Math.round((existing.periodCredit + line.functionalCredit) * 100) / 100
        existing.closingDebit = existing.openingDebit + existing.periodDebit
        existing.closingCredit = existing.openingCredit + existing.periodCredit
        _balances.set(balanceKey, existing)
      } else {
        const newBalance: GLBalance = {
          id: generateId(),
          tenantId: journal.tenantId,
          entityId: line.entityId,
          accountId: line.accountId,
          accountCode: line.accountCode,
          accountName: line.accountName,
          periodId: journal.periodId,
          openingDebit: 0,
          openingCredit: 0,
          periodDebit: line.functionalDebit,
          periodCredit: line.functionalCredit,
          closingDebit: line.functionalDebit,
          closingCredit: line.functionalCredit,
          currency: line.currency,
        }
        _balances.set(balanceKey, newBalance)
      }
      balancesUpdated++
    }

    // 5. Update journal status
    const updatedJournal: Journal = {
      ...journal,
      status: 'posted',
      postedAt,
      totalDebit: validation.totalDebit,
      totalCredit: validation.totalCredit,
    }
    _journals.set(journal.id, updatedJournal)

    // 6. Write audit event
    const ctx: ServiceContext = {
      tenantId: journal.tenantId,
      entityId: journal.entityId,
      userId: journal.postedBy ?? journal.approvedBy ?? journal.preparedBy,
      userRole: 'accountant',
    }
    const auditEvent = await services.audit.log(ctx, 'journal.posted', {
      sourceModule: journal.sourceModule,
      resourceType: 'journal',
      resourceId: journal.id,
      description: `Journal ${journal.reference} posted — ${validation.totalDebit.toFixed(2)} DR / ${validation.totalCredit.toFixed(2)} CR`,
      beforeState: { status: journal.status },
      afterState: { status: 'posted', postedAt },
      metadata: { totalDebit: validation.totalDebit, totalCredit: validation.totalCredit, lineCount: journal.lines.length },
    })

    return {
      success: true,
      journalId: journal.id,
      postedAt,
      balancesUpdated,
      auditEventId: auditEvent.id,
      errors: [],
    }
  }

  /**
   * Creates a reversal journal (new document, not edit), marks original as reversed.
   */
  static async reverseJournal(
    journalId: string,
    reason: string,
    services: PlatformServices,
    reversedBy: string,
  ): Promise<Journal> {
    const original = _journals.get(journalId)
    if (!original) throw new Error(`Journal ${journalId} not found`)
    if (original.status !== 'posted') throw new Error('Only posted journals can be reversed')

    const periodStatus = await services.getPeriodStatus(original.periodId)
    if (periodStatus === 'locked') throw new Error('Cannot reverse a journal in a locked period')

    const reversalId = generateId()
    const now = new Date().toISOString()

    // Swap debit/credit on each line
    const reversalLines: JournalLine[] = original.lines.map((line, idx) => ({
      ...line,
      id: generateId(),
      journalId: reversalId,
      sequence: idx + 1,
      debit: line.credit,
      credit: line.debit,
      functionalDebit: line.functionalCredit,
      functionalCredit: line.functionalDebit,
      description: `Reversal: ${line.description}`,
    }))

    const reversal: Journal = {
      id: reversalId,
      tenantId: original.tenantId,
      entityId: original.entityId,
      periodId: original.periodId,
      reference: `REV-${original.reference}`,
      description: `Reversal of ${original.reference}: ${reason}`,
      status: 'draft',
      preparedBy: reversedBy,
      preparedAt: now,
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
      originalJournalId: journalId,
      sourceModule: original.sourceModule,
      sourceId: original.sourceId,
      totalDebit: original.totalCredit,
      totalCredit: original.totalDebit,
      lines: reversalLines,
      attachments: [],
    }

    _journals.set(reversalId, reversal)

    // Mark original as reversed
    const updatedOriginal: Journal = {
      ...original,
      status: 'reversed',
      reversedBy,
      reversedAt: now,
      reversalJournalId: reversalId,
    }
    _journals.set(journalId, updatedOriginal)

    const ctx: ServiceContext = {
      tenantId: original.tenantId,
      entityId: original.entityId,
      userId: reversedBy,
      userRole: 'accountant',
    }
    await services.audit.log(ctx, 'journal.reversed', {
      sourceModule: original.sourceModule,
      resourceType: 'journal',
      resourceId: journalId,
      description: `Journal ${original.reference} reversed — reason: ${reason}`,
      beforeState: { status: 'posted' },
      afterState: { status: 'reversed', reversalJournalId: reversalId },
      metadata: { reversalJournalId: reversalId, reason },
    })

    return reversal
  }

  /**
   * Get GL balance for an account in a period.
   */
  static async getAccountBalance(
    accountId: string,
    periodId: string,
    tenantId: string,
    entityId: string,
  ): Promise<GLBalance | null> {
    const key = `${tenantId}:${entityId}:${accountId}:${periodId}`
    return _balances.get(key) ?? null
  }

  static getJournal(id: string): Journal | undefined {
    return _journals.get(id)
  }

  static storeJournal(journal: Journal): void {
    _journals.set(journal.id, journal)
  }

  static getAllJournals(tenantId: string, entityId: string): Journal[] {
    return Array.from(_journals.values()).filter(
      (j) => j.tenantId === tenantId && j.entityId === entityId,
    )
  }
}
