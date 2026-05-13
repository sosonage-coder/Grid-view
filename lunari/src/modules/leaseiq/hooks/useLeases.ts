import { useState, useEffect, useCallback } from 'react'
import type { Lease } from '../types'
import { LeaseIQService } from '../leaseiq.service'
import { AuthService } from '../../../platform/services/auth.service'

export function useLeases() {
  const [leases, setLeases] = useState<Lease[]>([])
  const [loading, setLoading] = useState(true)
  const ctx = AuthService.getServiceContext()

  const load = useCallback(async () => {
    setLoading(true)
    setLeases(await LeaseIQService.getLeases(ctx))
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.tenantId, ctx.entityId])

  useEffect(() => { void load() }, [load])
  return { leases, loading, reload: load }
}
