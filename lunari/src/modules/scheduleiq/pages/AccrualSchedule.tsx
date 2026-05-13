import { useSchedules } from '../hooks/useSchedules'
import { DataTable } from '../../../components/ui/DataTable'
import { Badge } from '../../../components/ui/Badge'
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { formatCurrency } from '../../../platform/types/core'
import type { AccrualEntry } from '../types'
import type { Column } from '../../../components/ui/DataTable'

export function AccrualSchedulePage() {
  const { accruals, loading } = useSchedules()

  const columns: Column<AccrualEntry>[] = [
    { key: 'description', header: 'Description', render: (r) => <div><p className="text-slate-200 font-medium">{r.description}</p><p className="text-xs text-slate-500 capitalize">{r.category}</p></div> },
    { key: 'accrualDate', header: 'Accrual Date', render: (r) => <span className="font-mono text-xs">{r.accrualDate}</span> },
    { key: 'reversalDate', header: 'Reversal Date', render: (r) => <span className="font-mono text-xs">{r.reversalDate ?? '—'}</span> },
    { key: 'debitAccountCode', header: 'Debit Acct', render: (r) => <span className="font-mono text-sm text-slate-400">{r.debitAccountCode}</span> },
    { key: 'creditAccountCode', header: 'Credit Acct', render: (r) => <span className="font-mono text-sm text-slate-400">{r.creditAccountCode}</span> },
    { key: 'amount', header: 'Amount', align: 'right' as const, render: (r) => <span className="font-mono font-bold text-slate-100">{formatCurrency(r.amount, r.currency)}</span> },
    { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status === 'open' ? 'warning' : r.status === 'reversed' ? 'muted' : 'success'}>{r.status}</Badge> },
    { key: 'recurring', header: 'Recurring', render: (r) => r.recurring ? <Badge variant="info">Monthly</Badge> : <span className="text-slate-600 text-xs">One-time</span> },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Accrual Schedules</h1>
          <p className="text-sm text-slate-400 mt-0.5">{accruals.length} accruals · {accruals.filter((a) => a.status === 'open').length} open</p>
        </div>
        <Button variant="primary" size="sm">New Accrual</Button>
      </div>
      <Card padding="none">
        <CardHeader className="px-4 pt-4 pb-3"><CardTitle>Accrual Entries</CardTitle></CardHeader>
        <DataTable columns={columns} data={accruals} rowKey={(r) => r.id} loading={loading} emptyMessage="No accrual entries" />
      </Card>
    </div>
  )
}
