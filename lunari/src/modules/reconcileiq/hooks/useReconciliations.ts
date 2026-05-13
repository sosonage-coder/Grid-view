import { useState, useEffect, useCallback } from 'react'
import type { ReconWorksheet } from '../types'
import { ReconcileIQService } from '../reconcileiq.service'
import { AuthService } from '../../../platform/services/auth.service'

export function useReconciliations() {
  const [worksheets, setWorksheets] = useState<ReconWorksheet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const ctx = AuthService.getServiceContext()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setWorksheets(await ReconcileIQService.getWorksheets(ctx))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.tenantId, ctx.entityId])

  useEffect(() => { void load() }, [load])

  const approve = useCallback(async (id: string) => {
    await ReconcileIQService.approve(ctx, id)
    await load()
  }, [ctx, load])

  const submit = useCallback(async (id: string) => {
    await ReconcileIQService.submitForReview(ctx, id)
    await load()
  }, [ctx, load])

  return { worksheets, loading, error, reload: load, approve, submit }
}
