export type PBCStatus = 'open' | 'in_progress' | 'submitted' | 'under_review' | 'accepted' | 'rejected'
export type PBCPriority = 'urgent' | 'high' | 'normal' | 'low'
export type EvidenceType = 'document' | 'screenshot' | 'report' | 'reconciliation' | 'confirmation' | 'other'

export interface PBCItem {
  id: string
  tenantId: string
  entityId: string
  auditPeriod: string
  category: string
  requestNumber: string
  title: string
  description: string
  requestedBy: string
  requestedAt: string
  dueDate: string
  assignedTo: string
  status: PBCStatus
  priority: PBCPriority
  evidence: AuditEvidence[]
  comments: PBCComment[]
  relatedAccountIds: string[]
  notes: string | null
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AuditEvidence {
  id: string
  pbcItemId: string
  tenantId: string
  entityId: string
  title: string
  description: string
  evidenceType: EvidenceType
  fileUrl: string | null
  fileName: string | null
  fileSize: number | null
  period: string
  preparedBy: string
  preparedAt: string
  reviewedBy: string | null
  reviewedAt: string | null
  status: 'draft' | 'submitted' | 'accepted' | 'rejected'
  rejectionReason: string | null
  createdAt: string
}

export interface PBCComment {
  id: string
  pbcItemId: string
  authorId: string
  authorName: string
  content: string
  isAuditorComment: boolean
  createdAt: string
}

export interface EvidenceVaultFilter {
  status?: 'draft' | 'submitted' | 'accepted' | 'rejected'
  evidenceType?: EvidenceType
  period?: string
  search?: string
}
