import { useReconciliations } from '../hooks/useReconciliations'
import { DataTable } from '../../../components/ui/DataTable'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { useCurrentUser } from '../../../platform/hooks/useCurrentUser'
import { formatCurrency } from '../../../platform/types/core'
import type { ReconWorksheet, ReconStatus } from '../types'
import type { Column } from '../../../components/ui/DataTable'

function ReconStatusBadge({ status }: { status: ReconStatus }) {
  const map: Record<ReconStatus, 'muted' | 'info' | 'warning' | 'primary' | 'success' | 'danger' | 'default'> = {
    open: 'muted', in_progress: 'warning', prepared: 'info', reviewed: 'primary', approved: 'success', locked: 'danger',
  }
  return <Badge variant={map[status] ?? 'default'}>{status.replace('_', ' ')}</Badge>
}

export function ReconciliationList() {
  const { worksheets, loading, approve, submit } = useReconciliations()
  const { user, can } = useCurrentUser()

  const columns: Column<ReconWorksheet>[] = [
    { key: 'accountCode', header: 'Account', render: (r) => <div><p className="font-mono text-blue-400">{r.accountCode}</p><p className="text-xs text-slate-400">{r.accountName}</p></div> },
    { key: 'periodLabel', header: 'Period', render: (r) => <span className="font-mono text-sm">{r.periodLabel}</span> },
    { key: 'glBalance', header: 'GL Balance', align: 'right' as const, render: (r) => <span className="font-mono text-sm">{formatCurrency(r.glBalance, r.currency)}</span> },
    { key: 'unreconciledBalance', header: 'Unreconciled', align: 'right' as const, render: (r) => <span className={`font-mono text-sm ${r.unreconciledBalance !== 0 ? 'text-amber-400' : 'text-green-400'}`}>{formatCurrency(r.unreconciledBalance, r.currency)}</span> },
    { key: 'status', header: 'Status', render: (r) => <ReconStatusBadge status={r.status} /> },
    { key: 'preparedBy', header: 'Prepared By', render: (r) => <span className="text-xs text-slate-400">{r.preparedBy ?? '—'}</span> },
    {
      key: 'actions', header: '',
      render: (row) => (
        <div onClick={(e) => e.stopPropagation()}>
          {row.status === 'open' || row.status === 'in_progress' ? (
            <Button size="xs" variant="secondary" onClick={() => submit(row.id)}>Submit</Button>
          ) : row.status === 'prepared' && can('recon:approve') && row.preparedBy !== user.id ? (
            <Button size="xs" variant="success" onClick={() => approve(row.id)}>Approve</Button>
          ) : null}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Reconciliations</h1>
          <p className="text-sm text-slate-400 mt-0.5">{worksheets.length} worksheets · {worksheets.filter((w) => w.status === 'approved').length} approved</p>
        </div>
        {can('recon:create') && <Button variant="primary" size="sm">New Worksheet</Button>}
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <DataTable columns={columns} data={worksheets} rowKey={(r) => r.id} loading={loading} emptyMessage="No reconciliation worksheets" />
      </div>
    </div>
  )
}
