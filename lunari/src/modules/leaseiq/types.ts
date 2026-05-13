// IFRS 16 / ASC 842 lease accounting

export type LeaseType = 'operating' | 'finance'
export type LeaseStatus = 'draft' | 'active' | 'modified' | 'terminated' | 'expired'
export type LeaseClassification = 'short_term' | 'low_value' | 'standard'

export interface Lease {
  id: string
  tenantId: string
  entityId: string
  leaseNumber: string
  description: string
  lessor: string
  assetDescription: string
  assetCategory: 'real_estate' | 'equipment' | 'vehicles' | 'other'
  leaseType: LeaseType
  classification: LeaseClassification
  commencementDate: string
  expirationDate: string
  termMonths: number
  renewalOptions: number // months of renewal options
  purchaseOption: boolean
  currency: string
  monthlyPayment: number
  annualEscalation: number // % per year
  discountRate: number // implicit or incremental borrowing rate
  rightOfUseAsset: number // initial ROU asset value
  leaseLiability: number // initial lease liability
  accumulatedAmortization: number
  currentLiability: number // due within 12 months
  longTermLiability: number
  status: LeaseStatus
  glRoaAccountId: string
  glLiabilityAccountId: string
  glAmortizationAccountId: string
  glInterestAccountId: string
  notes: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface LeaseScheduleLine {
  id: string
  leaseId: string
  periodNumber: number
  periodDate: string
  periodId: string | null
  paymentAmount: number
  interestExpense: number
  principalReduction: number
  liabilityBalance: number
  rouAssetAmortization: number
  rouAssetBalance: number
  journalId: string | null
  status: 'scheduled' | 'posted' | 'reversed'
}

export interface LeaseModification {
  id: string
  leaseId: string
  effectiveDate: string
  description: string
  type: 'extension' | 'scope_increase' | 'scope_decrease' | 'termination'
  newTermMonths: number | null
  newMonthlyPayment: number | null
  newDiscountRate: number | null
  remeasuredLiability: number
  remeasuredROU: number
  journalId: string | null
  approvedBy: string | null
  createdAt: string
}
