import { useState, useEffect, useCallback } from 'react'
import type { RevenueContract } from '../types'
import { RevenueIQService } from '../revenueiq.service'
import { AuthService } from '../../../platform/services/auth.service'

export function useContracts() {
  const [contracts, setContracts] = useState<RevenueContract[]>([])
  const [loading, setLoading] = useState(true)
  const ctx = AuthService.getServiceContext()

  const load = useCallback(async () => {
    setLoading(true)
    setContracts(await RevenueIQService.getContracts(ctx))
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.tenantId, ctx.entityId])

  useEffect(() => { void load() }, [load])
  return { contracts, loading, reload: load }
}
