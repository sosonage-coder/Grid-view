import { useState, useEffect, useCallback } from 'react'
import type { ARInvoice, AgingReport, ARFilters } from '../types'
import { ReceivableIQService } from '../receivableiq.service'
import { AuthService } from '../../../platform/services/auth.service'

export function useReceivables(filters: ARFilters = {}) {
  const [invoices, setInvoices] = useState<ARInvoice[]>([])
  const [aging, setAging] = useState<AgingReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const ctx = AuthService.getServiceContext()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [data, agingData] = await Promise.all([
        ReceivableIQService.getInvoices(ctx, filters),
        ReceivableIQService.getAgingReport(ctx),
      ])
      setInvoices(data)
      setAging(agingData)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load receivables')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.tenantId, ctx.entityId, filters.status, filters.customerId, filters.search])

  useEffect(() => { void load() }, [load])

  const approve = useCallback(async (invoiceId: string) => {
    await ReceivableIQService.approveInvoice(ctx, invoiceId)
    await load()
  }, [ctx, load])

  return { invoices, aging, loading, error, reload: load, approve }
}
