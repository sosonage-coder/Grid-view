// ASC 606 / IFRS 15 revenue recognition

export type ContractStatus = 'draft' | 'active' | 'completed' | 'terminated' | 'disputed'
export type ObligationStatus = 'unsatisfied' | 'partially_satisfied' | 'fully_satisfied'
export type RecognitionMethod = 'point_in_time' | 'over_time'
export type AllocationMethod = 'standalone_selling_price' | 'residual' | 'adjusted_market'

export interface PerformanceObligation {
  id: string
  contractId: string
  description: string
  standaloneSellingPrice: number
  allocatedTransactionPrice: number
  recognizedAmount: number
  deferredAmount: number
  status: ObligationStatus
  recognitionMethod: RecognitionMethod
  startDate: string
  endDate: string | null
  completionPct: number
}

export interface RevenueContract {
  id: string
  tenantId: string
  entityId: string
  customerId: string
  customerName: string
  contractNumber: string
  contractDate: string
  currency: string
  totalTransactionPrice: number
  recognizedRevenue: number
  deferredRevenue: number
  status: ContractStatus
  obligations: PerformanceObligation[]
  contractModifications: ContractModification[]
  notes: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface ContractModification {
  id: string
  contractId: string
  modificationDate: string
  description: string
  priceChange: number
  scopeChange: string | null
  accountingTreatment: 'separate_contract' | 'prospective' | 'cumulative_catch_up'
  approvedBy: string | null
  createdAt: string
}

export interface RevenueScheduleLine {
  id: string
  contractId: string
  obligationId: string
  periodId: string
  periodLabel: string
  scheduledAmount: number
  recognizedAmount: number
  journalId: string | null
  status: 'scheduled' | 'recognized' | 'deferred'
}
