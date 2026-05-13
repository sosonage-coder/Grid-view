import { Card } from '../../../components/ui/Card'
import { useReceivables } from '../hooks/useReceivables'
import { formatCurrency } from '../../../platform/types/core'
import { Badge } from '../../../components/ui/Badge'

export function CustomerList() {
  const { invoices, loading } = useReceivables()

  const customerMap = new Map<string, { name: string; outstanding: number; invoiceCount: number; overdueCount: number }>()
  const today = new Date().toISOString().slice(0, 10)

  for (const inv of invoices) {
    const entry = customerMap.get(inv.customerId) ?? { name: inv.customerName, outstanding: 0, invoiceCount: 0, overdueCount: 0 }
    if (!['paid', 'void', 'written_off'].includes(inv.status)) {
      entry.outstanding += inv.outstandingAmount
      entry.invoiceCount++
      if (inv.dueDate < today) entry.overdueCount++
    }
    customerMap.set(inv.customerId, entry)
  }

  const customers = Array.from(customerMap.entries()).map(([id, data]) => ({ id, ...data })).sort((a, b) => b.outstanding - a.outstanding)

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-100">Customers</h1>
      {loading ? (
        <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-16 bg-slate-800 rounded-lg animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {customers.map((c) => (
            <Card key={c.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-200">{c.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{c.invoiceCount} open invoices</p>
              </div>
              <div className="flex items-center gap-4">
                {c.overdueCount > 0 && <Badge variant="danger">{c.overdueCount} overdue</Badge>}
                <div className="text-right">
                  <p className="font-mono font-bold text-slate-100">{formatCurrency(c.outstanding, 'USD')}</p>
                  <p className="text-xs text-slate-500">outstanding</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
