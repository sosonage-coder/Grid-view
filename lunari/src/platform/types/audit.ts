// ─── Audit Event ──────────────────────────────────────────────────────────────

export type AuditEventType =
  | 'journal.created'
  | 'journal.submitted'
  | 'journal.approved'
  | 'journal.rejected'
  | 'journal.posted'
  | 'journal.reversed'
  | 'period.opened'
  | 'period.closed'
  | 'period.locked'
  | 'period.unlocked'
  | 'invoice.created'
  | 'invoice.approved'
  | 'invoice.rejected'
  | 'invoice.posted'
  | 'invoice.voided'
  | 'payment.created'
  | 'payment.approved'
  | 'payment.processed'
  | 'user.login'
  | 'user.logout'
  | 'user.permission_changed'
  | 'entity.created'
  | 'entity.updated'
  | 'account.created'
  | 'account.updated'
  | 'account.deactivated'
  | 'reconciliation.started'
  | 'reconciliation.completed'
  | 'reconciliation.approved'
  | 'close.task_completed'
  | 'close.period_closed'
  | 'asset.created'
  | 'asset.disposed'
  | 'asset.deprecated'
  | 'compliance.evidence_submitted'
  | 'compliance.control_attested'
  | 'ai.suggestion_generated'
  | 'ai.anomaly_flagged'

export interface AuditEvent {
  id: string
  tenantId: string
  entityId: string
  userId: string
  userName: string
  eventType: AuditEventType
  sourceModule: string
  resourceType: string
  resourceId: string
  description: string
  beforeState: Record<string, unknown> | null
  afterState: Record<string, unknown> | null
  metadata: Record<string, unknown>
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

export interface AuditLog {
  events: AuditEvent[]
  total: number
  page: number
  pageSize: number
}

export interface AuditFilter {
  startDate?: string
  endDate?: string
  userId?: string
  eventType?: AuditEventType
  resourceType?: string
  resourceId?: string
  sourceModule?: string
}
