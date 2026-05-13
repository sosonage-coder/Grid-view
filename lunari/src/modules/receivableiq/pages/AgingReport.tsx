import { useReceivables } from '../hooks/useReceivables'
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card'
import { DataTable } from '../../../components/ui/DataTable'
import { formatCurrency } from '../../../platform/types/core'
import type { AgingReport } from '../types'
import type { Column } from '../../../components/ui/DataTable'

export function ARAgingReport() {
  const { aging, loading } = useReceivables()

  const totalByBucket = aging.reduce(
    (acc, r) => ({
      current: acc.current + r.current,
      days1to30: acc.days1to30 + r.days1to30,
      days31to60: acc.days31to60 + r.days31to60,
      days61to90: acc.days61to90 + r.days61to90,
      over90: acc.over90 + r.over90,
      total: acc.total + r.total,
    }),
    { current: 0, days1to30: 0, days31to60: 0, days61to90: 0, over90: 0, total: 0 },
  )

  const columns: Column<AgingReport>[] = [
    { key: 'customerName', header: 'Customer', render: (r) => <span className="text-slate-200 font-medium">{r.customerName}</span> },
    { key: 'current', header: 'Current', align: 'right' as const, render: (r) => <span className={`font-mono text-sm ${r.current > 0 ? 'text-green-400' : 'text-slate-600'}`}>{r.current > 0 ? formatCurrency(r.current, r.currency) : '—'}</span> },
    { key: 'days1to30', header: '1–30 Days', align: 'right' as const, render: (r) => <span className={`font-mono text-sm ${r.days1to30 > 0 ? 'text-amber-400' : 'text-slate-600'}`}>{r.days1to30 > 0 ? formatCurrency(r.days1to30, r.currency) : '—'}</span> },
    { key: 'days31to60', header: '31–60 Days', align: 'right' as const, render: (r) => <span className={`font-mono text-sm ${r.days31to60 > 0 ? 'text-orange-400' : 'text-slate-600'}`}>{r.days31to60 > 0 ? formatCurrency(r.days31to60, r.currency) : '—'}</span> },
    { key: 'days61to90', header: '61–90 Days', align: 'right' as const, render: (r) => <span className={`font-mono text-sm ${r.days61to90 > 0 ? 'text-red-400' : 'text-slate-600'}`}>{r.days61to90 > 0 ? formatCurrency(r.days61to90, r.currency) : '—'}</span> },
    { key: 'over90', header: '90+ Days', align: 'right' as const, render: (r) => <span className={`font-mono text-sm font-bold ${r.over90 > 0 ? 'text-red-500' : 'text-slate-600'}`}>{r.over90 > 0 ? formatCurrency(r.over90, r.currency) : '—'}</span> },
    { key: 'total', header: 'Total', align: 'right' as const, render: (r) => <span className="font-mono text-sm font-bold text-slate-100">{formatCurrency(r.total, r.currency)}</span> },
  ]

  const buckets = [
    { label: 'Current', value: totalByBucket.current, color: 'bg-green-500' },
    { label: '1–30 Days', value: totalByBucket.days1to30, color: 'bg-amber-500' },
    { label: '31–60 Days', value: totalByBucket.days31to60, color: 'bg-orange-500' },
    { label: '61–90 Days', value: totalByBucket.days61to90, color: 'bg-red-400' },
    { label: '90+ Days', value: totalByBucket.over90, color: 'bg-red-600' },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-100">AR Aging Report</h1>
        <p className="text-sm text-slate-400 mt-0.5">Outstanding receivables by aging bucket</p>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {buckets.map((b) => (
          <Card key={b.label} className="text-center">
            <p className="text-xs text-slate-500 uppercase">{b.label}</p>
            <p className="font-mono font-bold text-slate-100 text-sm mt-1">{formatCurrency(b.value, 'USD')}</p>
            <div className="h-1 mt-2 bg-slate-700 rounded-full overflow-hidden">
              <div className={`h-full ${b.color} rounded-full`} style={{ width: totalByBucket.total > 0 ? `${(b.value / totalByBucket.total) * 100}%` : '0%' }} />
            </div>
          </Card>
        ))}
      </div>

      <Card padding="none">
        <CardHeader className="px-4 pt-4 pb-3">
          <CardTitle>By Customer</CardTitle>
          <span className="text-sm font-mono text-slate-300 font-bold">{formatCurrency(totalByBucket.total, 'USD')} total</span>
        </CardHeader>
        <DataTable columns={columns} data={aging} rowKey={(r) => r.customerId} loading={loading} emptyMessage="No outstanding receivables" />
      </Card>
    </div>
  )
}
