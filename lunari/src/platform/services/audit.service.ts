import type { AuditEvent, AuditEventType, AuditFilter, AuditLog } from '../types/audit'
import type { ServiceContext } from '../types/core'
import { generateId } from '../../engine/ledger.engine'

// In-memory audit store for dev (in production, writes to audit_log table via RLS)
const _auditStore: AuditEvent[] = []

export class AuditService {
  static async log(
    ctx: ServiceContext,
    eventType: AuditEventType,
    params: {
      sourceModule: string
      resourceType: string
      resourceId: string
      description: string
      beforeState?: Record<string, unknown>
      afterState?: Record<string, unknown>
      metadata?: Record<string, unknown>
    },
  ): Promise<AuditEvent> {
    const event: AuditEvent = {
      id: generateId(),
      tenantId: ctx.tenantId,
      entityId: ctx.entityId,
      userId: ctx.userId,
      userName: ctx.userId, // resolved by auth service in production
      eventType,
      sourceModule: params.sourceModule,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      description: params.description,
      beforeState: params.beforeState ?? null,
      afterState: params.afterState ?? null,
      metadata: params.metadata ?? {},
      ipAddress: null,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      createdAt: new Date().toISOString(),
    }

    // Dev: store in memory
    _auditStore.push(event)

    // Production: write to audit_log via Supabase (never updates, never deletes)
    // await dbInsert('audit_log', event)

    return event
  }

  static async getAuditLog(
    ctx: ServiceContext,
    filters: AuditFilter = {},
    page = 1,
    pageSize = 50,
  ): Promise<AuditLog> {
    let events = _auditStore.filter(
      (e) => e.tenantId === ctx.tenantId && e.entityId === ctx.entityId,
    )

    if (filters.startDate) {
      events = events.filter((e) => e.createdAt >= filters.startDate!)
    }
    if (filters.endDate) {
      events = events.filter((e) => e.createdAt <= filters.endDate!)
    }
    if (filters.userId) {
      events = events.filter((e) => e.userId === filters.userId)
    }
    if (filters.eventType) {
      events = events.filter((e) => e.eventType === filters.eventType)
    }
    if (filters.resourceType) {
      events = events.filter((e) => e.resourceType === filters.resourceType)
    }
    if (filters.resourceId) {
      events = events.filter((e) => e.resourceId === filters.resourceId)
    }
    if (filters.sourceModule) {
      events = events.filter((e) => e.sourceModule === filters.sourceModule)
    }

    events.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    const total = events.length
    const sliced = events.slice((page - 1) * pageSize, page * pageSize)

    return { events: sliced, total, page, pageSize }
  }

  static getRecentEvents(tenantId: string, entityId: string, limit = 20): AuditEvent[] {
    return _auditStore
      .filter((e) => e.tenantId === tenantId && e.entityId === entityId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
  }
}
