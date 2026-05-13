import { useState, useEffect, useCallback } from 'react'
import type { PBCItem, AuditEvidence } from '../types'
import { AuditIQService } from '../auditiq.service'
import { AuthService } from '../../../platform/services/auth.service'

export function useAudit(auditPeriod?: string) {
  const [pbcItems, setPBCItems] = useState<PBCItem[]>([])
  const [evidence, setEvidence] = useState<AuditEvidence[]>([])
  const [loading, setLoading] = useState(true)
  const ctx = AuthService.getServiceContext()

  const load = useCallback(async () => {
    setLoading(true)
    const [items, ev] = await Promise.all([
      AuditIQService.getPBCItems(ctx, auditPeriod),
      AuditIQService.getEvidenceVault(ctx),
    ])
    setPBCItems(items)
    setEvidence(ev)
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.tenantId, ctx.entityId, auditPeriod])

  useEffect(() => { void load() }, [load])

  const addComment = useCallback(async (pbcItemId: string, content: string) => {
    await AuditIQService.addComment(ctx, pbcItemId, content)
    await load()
  }, [ctx, load])

  return { pbcItems, evidence, loading, reload: load, addComment }
}
