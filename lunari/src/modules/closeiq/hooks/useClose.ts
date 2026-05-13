import { useState, useEffect, useCallback } from 'react'
import type { CloseChecklist, CloseCalendarEntry, CloseTask } from '../types'
import { CloseIQService } from '../closeiq.service'
import { AuthService } from '../../../platform/services/auth.service'

export function useClose(periodId: string) {
  const [checklist, setChecklist] = useState<CloseChecklist | null>(null)
  const [calendar, setCalendar] = useState<CloseCalendarEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const ctx = AuthService.getServiceContext()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cl, cal] = await Promise.all([
        CloseIQService.getChecklist(ctx, periodId),
        CloseIQService.getCalendar(ctx),
      ])
      setChecklist(cl)
      setCalendar(cal)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load close data')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.tenantId, ctx.entityId, periodId])

  useEffect(() => { void load() }, [load])

  const completeTask = useCallback(async (taskId: string): Promise<CloseTask> => {
    const result = await CloseIQService.completeTask(ctx, taskId)
    await load()
    return result
  }, [ctx, load])

  return { checklist, calendar, loading, error, reload: load, completeTask }
}
