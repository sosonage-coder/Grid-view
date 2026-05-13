export type BankAccountType = 'checking' | 'savings' | 'money_market' | 'credit_line'

export interface BankAccount {
  id: string
  tenantId: string
  entityId: string
  name: string
  bankName: string
  accountNumber: string // last 4 digits for display
  routingNumber: string
  accountType: BankAccountType
  currency: string
  glAccountId: string
  glAccountCode: string
  currentBalance: number
  availableBalance: number
  lastReconciledDate: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type TransactionType = 'debit' | 'credit'
export type TransactionStatus = 'unreconciled' | 'reconciled' | 'excluded'

export interface BankTransaction {
  id: string
  tenantId: string
  entityId: string
  bankAccountId: string
  transactionDate: string
  valueDate: string
  description: string
  reference: string | null
  amount: number
  type: TransactionType
  currency: string
  balance: number
  status: TransactionStatus
  matchedJournalLineId: string | null
  importedAt: string
}

export type ReconciliationStatus = 'in_progress' | 'completed' | 'approved'

export interface BankReconciliation {
  id: string
  tenantId: string
  entityId: string
  bankAccountId: string
  periodId: string
  statementDate: string
  statementBalance: number
  glBalance: number
  reconciledBalance: number
  difference: number
  status: ReconciliationStatus
  reconciledBy: string | null
  approvedBy: string | null
  approvedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CashPosition {
  entityId: string
  entityName: string
  currency: string
  accounts: BankAccount[]
  totalBalance: number
  totalAvailable: number
  asOfDate: string
}
