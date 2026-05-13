import { useState, useEffect, useCallback } from 'react'
import type { PrepaidSchedule, AccrualEntry } from '../types'
import { ScheduleIQService } from '../scheduleiq.service'
import { AuthService } from '../../../platform/services/auth.service'

export function useSchedules() {
  const [prepaids, setPrepaids] = useState<PrepaidSchedule[]>([])
  const [accruals, setAccruals] = useState<AccrualEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const ctx = AuthService.getServiceContext()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [p, a] = await Promise.all([ScheduleIQService.getPrepaids(ctx), ScheduleIQService.getAccruals(ctx)])
      setPrepaids(p)
      setAccruals(a)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load schedules')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.tenantId, ctx.entityId])

  useEffect(() => { void load() }, [load])
  return { prepaids, accruals, loading, error, reload: load }
}
