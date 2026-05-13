export type PrepaidStatus = 'active' | 'fully_amortized' | 'terminated' | 'suspended'
export type AccrualStatus = 'open' | 'reversed' | 'settled'
export type AmortizationMethod = 'straight_line' | 'declining_balance' | 'units_of_production'

export interface PrepaidSchedule {
  id: string
  tenantId: string
  entityId: string
  description: string
  vendor: string
  invoiceId: string | null
  startDate: string
  endDate: string
  totalAmount: number
  amortizedAmount: number
  remainingAmount: number
  currency: string
  prepaidAccountId: string
  prepaidAccountCode: string
  expenseAccountId: string
  expenseAccountCode: string
  amortizationMethod: AmortizationMethod
  monthlyAmount: number
  status: PrepaidStatus
  createdBy: string
  createdAt: string
  updatedAt: string
  lines: PrepaidAmortizationLine[]
}

export interface PrepaidAmortizationLine {
  id: string
  prepaidId: string
  periodId: string
  periodLabel: string
  amount: number
  journalId: string | null
  postedAt: string | null
  status: 'scheduled' | 'posted' | 'reversed'
}

export interface AccrualEntry {
  id: string
  tenantId: string
  entityId: string
  description: string
  accrualDate: string
  reversalDate: string | null
  amount: number
  currency: string
  debitAccountId: string
  debitAccountCode: string
  creditAccountId: string
  creditAccountCode: string
  journalId: string | null
  reversalJournalId: string | null
  status: AccrualStatus
  category: 'expense' | 'revenue' | 'payroll' | 'interest' | 'other'
  recurring: boolean
  recurringMonths: number | null
  notes: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}
