// ─── Journal ──────────────────────────────────────────────────────────────────

export type JournalStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'posted'
  | 'reversed'
  | 'rejected'

export type SourceModule =
  | 'manual'
  | 'payiq'
  | 'receivableiq'
  | 'cashiq'
  | 'reconcileiq'
  | 'closeiq'
  | 'scheduleiq'
  | 'revenueiq'
  | 'leaseiq'
  | 'assetiq'
  | 'fx_revaluation'

export interface JournalLine {
  id: string
  journalId: string
  sequence: number
  accountId: string
  accountCode: string
  accountName: string
  description: string
  debit: number
  credit: number
  currency: string
  fxRate: number // 1.0 if same as functional currency
  functionalDebit: number // translated to entity functional currency
  functionalCredit: number // translated to entity functional currency
  entityId: string // for intercompany lines
}

export interface Journal {
  id: string
  tenantId: string
  entityId: string
  periodId: string
  reference: string
  description: string
  status: JournalStatus
  preparedBy: string // userId
  preparedAt: string
  submittedAt: string | null
  approvedBy: string | null // userId
  approvedAt: string | null
  rejectedBy: string | null
  rejectedAt: string | null
  rejectionReason: string | null
  postedBy: string | null
  postedAt: string | null
  reversedBy: string | null
  reversedAt: string | null
  reversalJournalId: string | null // new journal created for reversal
  originalJournalId: string | null // if this is a reversal, points to original
  sourceModule: SourceModule
  sourceId: string | null // e.g. invoice ID that triggered this journal
  totalDebit: number
  totalCredit: number
  lines: JournalLine[]
  attachments: JournalAttachment[]
}

export interface JournalAttachment {
  id: string
  journalId: string
  fileName: string
  fileUrl: string
  fileSize: number
  mimeType: string
  uploadedBy: string
  uploadedAt: string
}

// ─── GL Balance ───────────────────────────────────────────────────────────────

export interface GLBalance {
  id: string
  tenantId: string
  entityId: string
  accountId: string
  accountCode: string
  accountName: string
  periodId: string
  openingDebit: number
  openingCredit: number
  periodDebit: number
  periodCredit: number
  closingDebit: number
  closingCredit: number
  currency: string
}

// ─── FX Rate ──────────────────────────────────────────────────────────────────

export interface FXRate {
  id: string
  tenantId: string
  fromCurrency: string
  toCurrency: string
  rate: number
  rateType: 'spot' | 'average' | 'closing'
  effectiveDate: string
  source: string
  createdAt: string
}

// ─── Validation & Result types ────────────────────────────────────────────────

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  totalDebit: number
  totalCredit: number
  difference: number
}

export interface PostingResult {
  success: boolean
  journalId: string
  postedAt: string
  balancesUpdated: number
  auditEventId: string
  errors: string[]
}

export interface OpenItemCheck {
  type: string
  count: number
  description: string
  blocking: boolean
}

export interface CloseReadiness {
  canClose: boolean
  blockers: OpenItemCheck[]
  warnings: OpenItemCheck[]
  checkedAt: string
}
