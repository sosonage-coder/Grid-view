import { useState, useEffect, useCallback } from 'react'
import type { APInvoice, InvoiceFilters } from '../types'
import { PayIQService } from '../payiq.service'
import { AuthService } from '../../../platform/services/auth.service'

export function useInvoices(filters: InvoiceFilters = {}) {
  const [invoices, setInvoices] = useState<APInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const ctx = AuthService.getServiceContext()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await PayIQService.getInvoices(ctx, filters)
      setInvoices(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load invoices')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.tenantId, ctx.entityId, filters.status, filters.vendorId, filters.search])

  useEffect(() => { void load() }, [load])

  const approve = useCallback(async (invoiceId: string) => {
    await PayIQService.approveInvoice(ctx, invoiceId)
    await load()
  }, [ctx, load])

  const reject = useCallback(async (invoiceId: string, reason: string) => {
    await PayIQService.rejectInvoice(ctx, invoiceId, reason)
    await load()
  }, [ctx, load])

  const post = useCallback(async (invoiceId: string) => {
    await PayIQService.postInvoice(ctx, invoiceId)
    await load()
  }, [ctx, load])

  return { invoices, loading, error, reload: load, approve, reject, post }
}
