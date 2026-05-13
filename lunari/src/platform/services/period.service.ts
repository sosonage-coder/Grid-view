import type { AccountingPeriod } from '../types/core'
import { PeriodEngine } from '../../engine/period.engine'

// ─── PeriodService ────────────────────────────────────────────────────────────
// Thin adapter over PeriodEngine for use in service contexts.

export class PeriodService {
  static async checkPeriodLock(periodId: string): Promise<void> {
    const status = PeriodEngine.getPeriodStatus(periodId)
    if (status === 'locked') {
      throw new Error(`Period ${periodId} is locked. Posting is not allowed.`)
    }
    if (status === 'closed') {
      throw new Error(`Period ${periodId} is closed. Reopen it before posting.`)
    }
  }

  static async getPeriod(periodId: string): Promise<AccountingPeriod | null> {
    return PeriodEngine.getPeriod(periodId) ?? null
  }

  static async getPeriodsForEntity(tenantId: string, entityId: string): Promise<AccountingPeriod[]> {
    return PeriodEngine.getPeriodsForEntity(tenantId, entityId)
  }

  static async getCurrentOpenPeriod(tenantId: string, entityId: string): Promise<AccountingPeriod | null> {
    return PeriodEngine.getCurrentOpenPeriod(tenantId, entityId)
  }

  static getPeriodLabel(period: AccountingPeriod): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${months[period.month - 1]} ${period.year}`
  }

  static getPeriodId(year: number, month: number): string {
    return `period-${year}-${String(month).padStart(2, '0')}`
  }
}
