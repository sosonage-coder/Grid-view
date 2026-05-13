import { useState, useEffect, useCallback } from 'react'
import type { Control, ComplianceObligation, ControlMatrix } from '../types'
import { ComplianceHubService } from '../compliancehub.service'
import { AuthService } from '../../../platform/services/auth.service'

export function useCompliance() {
  const [controls, setControls] = useState<Control[]>([])
  const [obligations, setObligations] = useState<ComplianceObligation[]>([])
  const [matrix, setMatrix] = useState<ControlMatrix | null>(null)
  const [loading, setLoading] = useState(true)
  const ctx = AuthService.getServiceContext()

  const load = useCallback(async () => {
    setLoading(true)
    const [c, o, m] = await Promise.all([
      ComplianceHubService.getControls(ctx),
      ComplianceHubService.getObligations(ctx),
      ComplianceHubService.getControlMatrix(ctx),
    ])
    setControls(c)
    setObligations(o)
    setMatrix(m)
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.tenantId, ctx.entityId])

  useEffect(() => { void load() }, [load])
  return { controls, obligations, matrix, loading, reload: load }
}
