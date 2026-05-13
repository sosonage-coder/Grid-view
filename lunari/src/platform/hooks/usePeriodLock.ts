import { useState, useEffect } from 'react'
import type { AccountingPeriod } from '../types/core'
import { PeriodEngine } from '../../engine/period.engine'
import { AuthService } from '../services/auth.service'

export function usePeriodLock(periodId?: string): {
  period: AccountingPeriod | null
  isLocked: boolean
  isClosed: boolean
  loading: boolean
} {
  const entity = AuthService.getCurrentEntity()
  const tenant = AuthService.getCurrentTenant()

  const [period, setPeriod] = useState<AccountingPeriod | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    try {
      if (periodId) {
        setPeriod(PeriodEngine.getPeriod(periodId) ?? null)
      } else {
        setPeriod(PeriodEngine.getCurrentOpenPeriod(tenant.id, entity.id))
      }
    } finally {
      setLoading(false)
    }
  }, [periodId, tenant.id, entity.id])

  const isLocked = period?.status === 'locked'
  const isClosed = period?.status === 'closed' || period?.status === 'locked'

  return { period, isLocked, isClosed, loading }
}
