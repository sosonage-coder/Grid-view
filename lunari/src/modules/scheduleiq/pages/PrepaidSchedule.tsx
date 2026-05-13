import { useSchedules } from '../hooks/useSchedules'
import { DataTable } from '../../../components/ui/DataTable'
import { Badge } from '../../../components/ui/Badge'
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card'
import { formatCurrency } from '../../../platform/types/core'
import type { PrepaidSchedule } from '../types'
import type { Column } from '../../../components/ui/DataTable'

export function PrepaidSchedulePage() {
  const { prepaids, loading } = useSchedules()

  const totalActive = prepaids.filter((p) => p.status === 'active').reduce((s, p) => s + p.remainingAmount, 0)

  const columns: Column<PrepaidSchedule>[] = [
    { key: 'description', header: 'Description', render: (r) => <div><p className="text-slate-200 font-medium">{r.description}</p><p className="text-xs text-slate-500">{r.vendor}</p></div> },
    { key: 'startDate', header: 'Start', render: (r) => <span className="font-mono text-xs">{r.startDate}</span> },
    { key: 'endDate', header: 'End', render: (r) => <span className="font-mono text-xs">{r.endDate}</span> },
    { key: 'totalAmount', header: 'Total', align: 'right' as const, render: (r) => <span className="font-mono text-sm">{formatCurrency(r.totalAmount, r.currency)}</span> },
    { key: 'amortizedAmount', header: 'Amortized', align: 'right' as const, render: (r) => <span className="font-mono text-sm text-slate-400">{formatCurrency(r.amortizedAmount, r.currency)}</span> },
    { key: 'remainingAmount', header: 'Remaining', align: 'right' as const, render: (r) => <span className="font-mono text-sm text-amber-400">{formatCurrency(r.remainingAmount, r.currency)}</span> },
    { key: 'monthlyAmount', header: 'Monthly', align: 'right' as const, render: (r) => <span className="font-mono text-sm">{formatCurrency(r.monthlyAmount, r.currency)}</span> },
    { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status === 'active' ? 'success' : r.status === 'fully_amortized' ? 'muted' : 'warning'}>{r.status.replace('_', ' ')}</Badge> },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Prepaid Schedules</h1>
          <p className="text-sm text-slate-400 mt-0.5">{prepaids.length} schedules · {formatCurrency(totalActive, 'USD')} remaining</p>
        </div>
      </div>

      <Card padding="none">
        <CardHeader className="px-4 pt-4 pb-3">
          <CardTitle>Active Schedules</CardTitle>
        </CardHeader>
        <DataTable columns={columns} data={prepaids} rowKey={(r) => r.id} loading={loading} emptyMessage="No prepaid schedules" />
      </Card>
    </div>
  )
}
