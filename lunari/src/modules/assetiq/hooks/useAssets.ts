import { useState, useEffect, useCallback } from 'react'
import type { FixedAsset } from '../types'
import { AssetIQService } from '../assetiq.service'
import { AuthService } from '../../../platform/services/auth.service'

export function useAssets() {
  const [assets, setAssets] = useState<FixedAsset[]>([])
  const [loading, setLoading] = useState(true)
  const ctx = AuthService.getServiceContext()

  const load = useCallback(async () => {
    setLoading(true)
    setAssets(await AssetIQService.getAssets(ctx))
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.tenantId, ctx.entityId])

  useEffect(() => { void load() }, [load])
  return { assets, loading, reload: load }
}
