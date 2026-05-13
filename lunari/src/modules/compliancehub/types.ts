export type ObligationStatus = 'active' | 'expired' | 'pending' | 'waived'
export type ObligationFrequency = 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'ad_hoc'
export type ControlStatus = 'effective' | 'deficient' | 'material_weakness' | 'not_tested'
export type ControlType = 'preventive' | 'detective' | 'corrective'
export type EvidenceStatus = 'pending' | 'submitted' | 'accepted' | 'rejected'
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low'

export interface ComplianceObligation {
  id: string
  tenantId: string
  entityId: string
  name: string
  description: string
  regulatoryBody: string
  framework: string // SOX, GAAP, IFRS, etc.
  frequency: ObligationFrequency
  nextDueDate: string
  lastCompletedDate: string | null
  status: ObligationStatus
  owner: string
  riskLevel: RiskLevel
  relatedControls: string[]
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface Control {
  id: string
  tenantId: string
  entityId: string
  controlId: string // e.g. CTRL-001
  name: string
  description: string
  type: ControlType
  frequency: ObligationFrequency
  owner: string
  reviewer: string | null
  riskLevel: RiskLevel
  status: ControlStatus
  lastTestedDate: string | null
  nextTestDate: string | null
  framework: string
  process: string
  narrative: string | null
  evidence: ComplianceEvidence[]
  createdAt: string
  updatedAt: string
}

export interface ComplianceEvidence {
  id: string
  tenantId: string
  entityId: string
  controlId: string | null
  obligationId: string | null
  title: string
  description: string
  evidenceDate: string
  fileUrl: string | null
  fileName: string | null
  status: EvidenceStatus
  submittedBy: string
  submittedAt: string
  reviewedBy: string | null
  reviewedAt: string | null
  rejectionReason: string | null
  createdAt: string
}

export interface ControlMatrix {
  entityId: string
  totalControls: number
  effectiveControls: number
  deficientControls: number
  materialWeaknesses: number
  notTested: number
  byRisk: Record<RiskLevel, number>
  byProcess: Record<string, number>
}
