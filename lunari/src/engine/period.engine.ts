import type { AccountingPeriod } from '../platform/types/core'
import type { CloseReadiness, OpenItemCheck } from '../platform/types/ledger'
import { AuditService } from '../platform/services/audit.service'
import type { ServiceContext } from '../platform/types/core'
import { generateId } from './ledger.engine'

// ─── In-memory period store (dev) ─────────────────────────────────────────────

const _periods: Map<string, AccountingPeriod> = new Map()

// Seed some default periods
;(function seedPeriods() {
  const tenantId = 'tenant-acme'
  const entityId = 'entity-us'
  for (let month = 1; month <= 12; month++) {
    const id = `period-2024-${String(month).padStart(2, '0')}`
    const status: 'open' | 'closed' | 'locked' =
      month < 11 ? 'locked' : month === 11 ? 'closed' : 'open'
    _periods.set(id, {
      id,
      tenantId,
      entityId,
      year: 2024,
      month,
      status,
      openedAt: `2024-${String(month).padStart(2, '0')}-01T00:00:00Z`,
      closedAt: status !== 'open' ? `2024-${String(month).padStart(2, '0')}-31T23:59:59Z` : null,
      closedBy: status !== 'open' ? 'user-controller' : null,
      lockedAt: status === 'locked' ? `2024-${String(month).padStart(2, '0')}-31T23:59:59Z` : null,
      lockedBy: status === 'locked' ? 'user-controller' : null,
    })
  }
  // Open period for 2025
  _periods.set('period-2025-01', {
    id: 'period-2025-01',
    tenantId,
    entityId,
    year: 2025,
    month: 1,
    status: 'open',
    openedAt: '2025-01-01T00:00:00Z',
    closedAt: null,
    closedBy: null,
    lockedAt: null,
    lockedBy: null,
  })
})()

// ─── PeriodEngine ─────────────────────────────────────────────────────────────

export class PeriodEngine {
  static isLocked(period: AccountingPeriod): boolean {
    return period.status === 'locked'
  }

  static isClosed(period: AccountingPeriod): boolean {
    return period.status === 'closed' || period.status === 'locked'
  }

  static canPost(period: AccountingPeriod): boolean {
    return period.status === 'open'
  }

  /**
   * Check whether a period can be closed given open items.
   */
  static canClose(period: AccountingPeriod, openItems: OpenItemCheck[]): CloseReadiness {
    const blockers = openItems.filter((i) => i.blocking && i.count > 0)
    const warnings = openItems.filter((i) => !i.blocking && i.count > 0)

    if (period.status === 'locked') {
      return {
        canClose: false,
        blockers: [{ type: 'period', count: 1, description: 'Period is already locked', blocking: true }],
        warnings: [],
        checkedAt: new Date().toISOString(),
      }
    }

    if (period.status === 'closed') {
      return {
        canClose: false,
        blockers: [{ type: 'period', count: 1, description: 'Period is already closed', blocking: true }],
        warnings: [],
        checkedAt: new Date().toISOString(),
      }
    }

    return {
      canClose: blockers.length === 0,
      blockers,
      warnings,
      checkedAt: new Date().toISOString(),
    }
  }

  /**
   * Lock a period (irreversible without explicit unlock permission).
   */
  static async lockPeriod(
    periodId: string,
    userId: string,
    services: { audit: typeof AuditService },
  ): Promise<AccountingPeriod> {
    const period = _periods.get(periodId)
    if (!period) throw new Error(`Period ${periodId} not found`)
    if (period.status === 'locked') throw new Error('Period is already locked')

    const now = new Date().toISOString()
    const updated: AccountingPeriod = {
      ...period,
      status: 'locked',
      lockedAt: now,
      lockedBy: userId,
      closedAt: period.closedAt ?? now,
      closedBy: period.closedBy ?? userId,
    }
    _periods.set(periodId, updated)

    const ctx: ServiceContext = { tenantId: period.tenantId, entityId: period.entityId, userId, userRole: 'finance_controller' }
    await services.audit.log(ctx, 'period.locked', {
      sourceModule: 'closeiq',
      resourceType: 'period',
      resourceId: periodId,
      description: `Period ${period.year}-${String(period.month).padStart(2, '0')} locked`,
      beforeState: { status: period.status },
      afterState: { status: 'locked', lockedAt: now },
    })

    return updated
  }

  /**
   * Unlock a period — requires explicit justification and high-privilege user.
   */
  static async unlockPeriod(
    periodId: string,
    userId: string,
    reason: string,
    services: { audit: typeof AuditService },
  ): Promise<AccountingPeriod> {
    const period = _periods.get(periodId)
    if (!period) throw new Error(`Period ${periodId} not found`)
    if (period.status !== 'locked') throw new Error('Period is not locked')
    if (!reason || reason.trim().length < 10) {
      throw new Error('A reason of at least 10 characters is required to unlock a period')
    }

    const updated: AccountingPeriod = {
      ...period,
      status: 'open',
      lockedAt: null,
      lockedBy: null,
    }
    _periods.set(periodId, updated)

    const ctx: ServiceContext = { tenantId: period.tenantId, entityId: period.entityId, userId, userRole: 'finance_controller' }
    await services.audit.log(ctx, 'period.unlocked', {
      sourceModule: 'closeiq',
      resourceType: 'period',
      resourceId: periodId,
      description: `Period ${period.year}-${String(period.month).padStart(2, '0')} unlocked — reason: ${reason}`,
      beforeState: { status: 'locked' },
      afterState: { status: 'open' },
      metadata: { reason },
    })

    return updated
  }

  /**
   * Close a period (allows locking later).
   */
  static async closePeriod(
    periodId: string,
    userId: string,
    services: { audit: typeof AuditService },
  ): Promise<AccountingPeriod> {
    const period = _periods.get(periodId)
    if (!period) throw new Error(`Period ${periodId} not found`)
    if (period.status !== 'open') throw new Error('Only open periods can be closed')

    const now = new Date().toISOString()
    const updated: AccountingPeriod = {
      ...period,
      status: 'closed',
      closedAt: now,
      closedBy: userId,
    }
    _periods.set(periodId, updated)

    const ctx: ServiceContext = { tenantId: period.tenantId, entityId: period.entityId, userId, userRole: 'finance_controller' }
    await services.audit.log(ctx, 'period.closed', {
      sourceModule: 'closeiq',
      resourceType: 'period',
      resourceId: periodId,
      description: `Period ${period.year}-${String(period.month).padStart(2, '0')} closed`,
      beforeState: { status: 'open' },
      afterState: { status: 'closed', closedAt: now },
    })

    return updated
  }

  static getPeriod(periodId: string): AccountingPeriod | undefined {
    return _periods.get(periodId)
  }

  static getPeriodStatus(periodId: string): 'open' | 'closed' | 'locked' {
    return _periods.get(periodId)?.status ?? 'open'
  }

  static getPeriodsForEntity(tenantId: string, entityId: string): AccountingPeriod[] {
    return Array.from(_periods.values())
      .filter((p) => p.tenantId === tenantId && p.entityId === entityId)
      .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
  }

  static getCurrentOpenPeriod(tenantId: string, entityId: string): AccountingPeriod | null {
    const periods = this.getPeriodsForEntity(tenantId, entityId)
    const openPeriods = periods.filter((p) => p.status === 'open')
    return openPeriods.length > 0 ? openPeriods[openPeriods.length - 1] : null
  }

  static upsertPeriod(period: Omit<AccountingPeriod, 'id'>): AccountingPeriod {
    const existing = Array.from(_periods.values()).find(
      (p) => p.tenantId === period.tenantId && p.entityId === period.entityId &&
             p.year === period.year && p.month === period.month,
    )
    if (existing) {
      const updated = { ...existing, ...period }
      _periods.set(existing.id, updated)
      return updated
    }
    const newPeriod = { ...period, id: generateId() }
    _periods.set(newPeriod.id, newPeriod)
    return newPeriod
  }
}
