import { useState } from 'react'
import { Play, AlertCircle } from 'lucide-react'
import { useInvoices } from '../hooks/useInvoices'
import { Button } from '../../../components/ui/Button'
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card'
import { APStatusChip } from '../../../components/ui/StatusChip'
import { formatCurrency } from '../../../platform/types/core'

export function PaymentRun() {
  const { invoices, loading } = useInvoices({ status: 'approved' })
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const payableInvoices = invoices.filter((i) => ['approved', 'posted'].includes(i.status))
  const selectedInvoices = payableInvoices.filter((i) => selected.has(i.id))
  const totalSelected = selectedInvoices.reduce((s, i) => s + i.outstandingAmount, 0)

  const toggleAll = () => {
    if (selected.size === payableInvoices.length) setSelected(new Set())
    else setSelected(new Set(payableInvoices.map((i) => i.id)))
  }

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="space-y-4 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Payment Run</h1>
        <p className="text-sm text-slate-400 mt-0.5">Select approved invoices to include in this payment run</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card padding="none">
            <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-3">
              <input
                type="checkbox"
                className="rounded border-slate-600 bg-slate-800 text-blue-500"
                checked={selected.size === payableInvoices.length && payableInvoices.length > 0}
                onChange={toggleAll}
              />
              <span className="text-sm font-medium text-slate-300">Select all ({payableInvoices.length} invoices)</span>
            </div>
            {loading ? (
              <div className="p-4 space-y-2">
                {[1,2,3].map((i) => <div key={i} className="h-12 bg-slate-700 rounded animate-pulse" />)}
              </div>
            ) : payableInvoices.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">No approved invoices available for payment</div>
            ) : (
              payableInvoices.map((inv) => {
                const overdue = inv.dueDate < today
                return (
                  <div
                    key={inv.id}
                    className={`flex items-center gap-3 px-4 py-3 border-b border-slate-700/50 cursor-pointer hover:bg-slate-700/20 transition-colors ${selected.has(inv.id) ? 'bg-blue-900/10' : ''}`}
                    onClick={() => toggle(inv.id)}
                  >
                    <input
                      type="checkbox"
                      className="rounded border-slate-600 bg-slate-800 text-blue-500"
                      checked={selected.has(inv.id)}
                      onChange={() => toggle(inv.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-blue-400">{inv.invoiceNumber}</span>
                        <span className="text-slate-300">{inv.vendorName}</span>
                        <APStatusChip status={inv.status} />
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                        <span>Due {inv.dueDate}</span>
                        {overdue && <span className="text-red-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" />Overdue</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-medium text-slate-200">{formatCurrency(inv.outstandingAmount, inv.currency)}</p>
                      <p className="text-xs text-slate-500">{inv.currency}</p>
                    </div>
                  </div>
                )
              })
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Run Summary</CardTitle></CardHeader>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Selected invoices</span>
                <span className="font-mono text-slate-200">{selectedInvoices.length}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total payment</span>
                <span className="font-mono text-slate-100 font-bold text-base">{formatCurrency(totalSelected, 'USD')}</span>
              </div>
              <div className="pt-2">
                <p className="text-xs text-slate-500 mb-2">Payment date</p>
                <input
                  type="date"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                  defaultValue={today}
                />
              </div>
              <Button
                variant="primary"
                className="w-full mt-2"
                leftIcon={<Play className="h-4 w-4" />}
                disabled={selectedInvoices.length === 0}
              >
                Submit Payment Run
              </Button>
              <p className="text-xs text-slate-500 text-center">Requires approval before processing</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
