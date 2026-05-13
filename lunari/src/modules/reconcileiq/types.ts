export type ReconStatus = 'open' | 'in_progress' | 'prepared' | 'reviewed' | 'approved' | 'locked'
export type ReconItemStatus = 'open' | 'matched' | 'exception' | 'cleared'

export interface ReconWorksheet {
  id: string
  tenantId: string
  entityId: string
  accountId: string
  accountCode: string
  accountName: string
  periodId: string
  periodLabel: string
  glBalance: number
  reconciledBalance: number
  unreconciledBalance: number
  status: ReconStatus
  preparedBy: string | null
  preparedAt: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  approvedBy: string | null
  approvedAt: string | null
  notes: string | null
  currency: string
  createdAt: string
  updatedAt: string
}

export interface ReconItem {
  id: string
  worksheetId: string
  description: string
  amount: number
  currency: string
  transactionDate: string
  referenceId: string | null
  referenceType: string | null
  status: ReconItemStatus
  matchedItemId: string | null
  notes: string | null
  addedBy: string
  addedAt: string
}

export type ReconciliationType =
  | 'bank'
  | 'intercompany'
  | 'prepaid'
  | 'accrual'
  | 'deferred_revenue'
  | 'fixed_asset'
  | 'accounts_payable'
  | 'accounts_receivable'
  | 'other'
