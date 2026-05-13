import type { ServiceContext } from '../platform/types/core'
import type { GLBalance } from '../platform/types/ledger'
import { AuditService } from '../platform/services/audit.service'
import { generateId } from '../engine/ledger.engine'
import type {
  JournalSuggestion,
  AnomalyFlag,
  CloseBlockerSummary,
  MatchSuggestion,
  VarianceExplanation,
  EvidenceDraft,
} from './types'

// ─── AI Service ───────────────────────────────────────────────────────────────
// IMPORTANT: All methods are READ-ONLY. None of these methods post journals,
// modify data, or call write services. They return suggestions only.

export class AIService {
  /**
   * Suggest journal entry lines based on a natural-language description.
   * Returns a suggestion only — the user must review and post manually.
   */
  static async suggestJournalEntry(
    ctx: ServiceContext,
    description: string,
  ): Promise<JournalSuggestion> {
    // In production, this calls an AI model (e.g., Claude via Anthropic API)
    // Here we return intelligent mock suggestions based on keywords

    await AuditService.log(ctx, 'ai.suggestion_generated', {
      sourceModule: 'ai',
      resourceType: 'journal_suggestion',
      resourceId: generateId(),
      description: `AI journal suggestion requested: "${description}"`,
      metadata: { query: description },
    })

    const lowerDesc = description.toLowerCase()

    if (lowerDesc.includes('depreciation') || lowerDesc.includes('deprec')) {
      return {
        description: 'Monthly depreciation expense for IT equipment',
        suggestedLines: [
          { accountCode: '5200', accountName: 'Depreciation Expense', debit: 4667, credit: 0, description: 'Monthly straight-line depreciation' },
          { accountCode: '1601', accountName: 'Accumulated Depreciation — IT', debit: 0, credit: 4667, description: 'Accumulated depreciation' },
        ],
        confidence: 0.92,
        reasoning: 'Based on your fixed asset register, monthly depreciation for active IT assets totals $4,667',
        warnings: [],
      }
    }

    if (lowerDesc.includes('prepaid') || lowerDesc.includes('amortiz')) {
      return {
        description: 'Prepaid expense amortization — monthly',
        suggestedLines: [
          { accountCode: '5060', accountName: 'Insurance Expense', debit: 10000, credit: 0, description: 'D&O insurance monthly amortization' },
          { accountCode: '1200', accountName: 'Prepaid Expenses', debit: 0, credit: 10000, description: 'Release prepaid to expense' },
        ],
        confidence: 0.88,
        reasoning: 'Your active prepaid schedule for D&O Insurance shows $10,000/month amortization',
        warnings: [],
      }
    }

    if (lowerDesc.includes('accrual') || lowerDesc.includes('payroll')) {
      return {
        description: 'Month-end payroll accrual',
        suggestedLines: [
          { accountCode: '5100', accountName: 'Payroll Expense', debit: 285000, credit: 0, description: 'Payroll accrual — period end' },
          { accountCode: '2050', accountName: 'Accrued Payroll', debit: 0, credit: 285000, description: 'Accrued payroll liability' },
        ],
        confidence: 0.85,
        reasoning: 'Based on prior months, your payroll accrual averages $285,000/month',
        warnings: ['Verify headcount changes before posting'],
      }
    }

    return {
      description: description,
      suggestedLines: [
        { accountCode: '5000', accountName: 'General Operating Expense', debit: 0, credit: 0, description: description },
        { accountCode: '2010', accountName: 'Accounts Payable', debit: 0, credit: 0, description: 'Offsetting entry' },
      ],
      confidence: 0.45,
      reasoning: 'Could not match description to a specific pattern. Please review and complete the journal lines.',
      warnings: ['Low confidence — review manually before posting'],
    }
  }

  /**
   * Detect anomalies in a journal entry.
   * Returns flags for review — never auto-posts or reverses.
   */
  static async detectAnomalies(ctx: ServiceContext, journalId: string): Promise<AnomalyFlag[]> {
    const flags: AnomalyFlag[] = []
    const now = new Date()
    const isWeekend = now.getDay() === 0 || now.getDay() === 6
    const isEndOfMonth = now.getDate() >= 28

    if (isWeekend) {
      flags.push({
        id: generateId(),
        journalId,
        type: 'weekend_posting',
        severity: 'warning',
        description: 'Journal is being prepared on a weekend',
        recommendation: 'Review whether weekend postings are expected for this transaction type',
        confidence: 0.8,
        detectedAt: now.toISOString(),
      })
    }

    if (isEndOfMonth) {
      flags.push({
        id: generateId(),
        journalId,
        type: 'end_of_period',
        severity: 'info',
        description: 'Journal is dated at period end — common for accruals and adjustments',
        recommendation: 'Ensure all period-end entries have appropriate supporting documentation',
        confidence: 0.75,
        detectedAt: now.toISOString(),
      })
    }

    await AuditService.log(ctx, 'ai.anomaly_flagged', {
      sourceModule: 'ai',
      resourceType: 'anomaly_analysis',
      resourceId: journalId,
      description: `AI anomaly check: ${flags.length} flag(s) detected`,
      metadata: { flagCount: flags.length },
    })

    return flags
  }

  /**
   * Summarize what's blocking the close for a period.
   */
  static async summarizeCloseBlockers(
    ctx: ServiceContext,
    periodId: string,
  ): Promise<CloseBlockerSummary> {
    void ctx
    return {
      periodId,
      totalBlockers: 5,
      criticalBlockers: 2,
      estimatedDaysToClose: 8,
      blockers: [
        { module: 'PayIQ', description: '3 AP invoices pending approval', count: 3, isCritical: false, suggestedAction: 'Route to James Wilson for approval' },
        { module: 'CashIQ', description: 'Bank reconciliation not started for Dec 2024', count: 1, isCritical: true, suggestedAction: 'Assign to Maria Rodriguez — due Jan 20' },
        { module: 'CloseIQ', description: 'Payroll accrual not posted', count: 1, isCritical: true, suggestedAction: 'Post accrual journal for $285,000' },
        { module: 'ReconcileIQ', description: '1 reconciliation worksheet in progress', count: 1, isCritical: false, suggestedAction: 'Complete prepaid account reconciliation' },
        { module: 'ScheduleIQ', description: 'Amortization not yet run for Jan 2025', count: 1, isCritical: false, suggestedAction: 'Run amortization batch for all active schedules' },
      ],
      aiSummary: 'Close is estimated to take 8 more days. Two critical items need immediate attention: the Dec bank reconciliation (overdue) and payroll accrual. Clearing these unblocks 4 downstream close tasks including the controller sign-off.',
    }
  }

  /**
   * Match a bank transaction to GL candidates.
   */
  static async matchBankTransaction(
    ctx: ServiceContext,
    _txId: string,
    candidates: GLBalance[],
  ): Promise<MatchSuggestion[]> {
    void ctx
    // In production, uses embedding similarity + amount matching
    return candidates.slice(0, 3).map((c, i) => ({
      candidateId: c.id,
      candidateDescription: `${c.accountCode} — ${c.accountName}`,
      matchScore: [0.91, 0.74, 0.52][i],
      matchReason: ['Exact amount match on same date', 'Amount within 2% — possible FX rounding', 'Partial match — different reference'][i],
      amountDifference: [0, 50, 1200][i],
      requiresInvestigation: i > 0,
    }))
  }

  /**
   * Explain a variance between two periods for an account.
   */
  static async explainVariance(
    ctx: ServiceContext,
    accountId: string,
    _currentPeriod: string,
    _priorPeriod: string,
  ): Promise<VarianceExplanation> {
    void ctx
    return {
      accountId,
      currentPeriodAmount: 35000,
      priorPeriodAmount: 28000,
      variance: 7000,
      variancePct: 25.0,
      explanation: `Marketing expenses increased $7,000 (25%) vs prior period. Primary driver is the Q4 marketing campaign (invoice MAC-2024-441, $35,000 vs prior period average of $28,000). This appears consistent with planned budget.`,
      driverCategories: [
        { category: 'Campaign spend', amount: 7000, description: 'Q4 marketing campaign — Acme Brand' },
      ],
      requiresAttention: false,
    }
  }

  /**
   * Draft audit evidence narrative for a PBC item.
   */
  static async draftAuditEvidence(
    ctx: ServiceContext,
    pbcItemId: string,
  ): Promise<EvidenceDraft> {
    void ctx
    return {
      pbcItemId,
      suggestedTitle: 'Bank Reconciliation — December 2024',
      suggestedDescription: 'Bank reconciliation for Operating Checking account (****4521) as of December 31, 2024. Statement balance reconciled to GL with zero outstanding difference.',
      suggestedSources: [
        'Bank statement (First National Bank, Dec 2024)',
        'GL Trial Balance (Account 1010)',
        'Outstanding items listing',
      ],
      draftNarrative: 'We performed a reconciliation of the operating checking account (First National Bank, account ending 4521) as of December 31, 2024. The bank statement balance of $2,847,500 was reconciled to the general ledger balance of $2,847,500 with no reconciling items. The reconciliation was prepared by Maria Rodriguez (Accountant) and reviewed by James Wilson (Finance Manager). There are no unusual items, stale-dated checks, or unexplained differences.',
      estimatedPrepTime: '2 hours',
    }
  }
}
