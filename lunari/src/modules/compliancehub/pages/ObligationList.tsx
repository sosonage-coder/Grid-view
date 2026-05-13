import { useCompliance } from '../hooks/useCompliance'
import { DataTable } from '../../../components/ui/DataTable'
import { Badge } from '../../../components/ui/Badge'
import type { ComplianceObligation, RiskLevel } from '../types'
import type { Column } from '../../../components/ui/DataTable'

const RISK_VARIANT: Record<RiskLevel, 'danger' | 'warning' | 'info' | 'muted'> = {
  critical: 'danger', high: 'warning', medium: 'info', low: 'muted',
}

export function ObligationList() {
  const { obligations, loading } = useCompliance()

  const upcoming = obligations.filter((o) => {
    const days = Math.ceil((new Date(o.nextDueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days <= 30 && days >= 0
  }).length

  const columns: Column<ComplianceObligation>[] = [
    { key: 'name', header: 'Obligation', render: (r) => <div><p className="text-slate-200 font-medium">{r.name}</p><p className="text-xs text-slate-500">{r.regulatoryBody} · {r.framework}</p></div> },
    { key: 'frequency', header: 'Frequency', render: (r) => <span className="text-sm text-slate-400 capitalize">{r.frequency.replace('_', ' ')}</span> },
    { key: 'nextDueDate', header: 'Next Due', render: (r) => {
      const days = Math.ceil((new Date(r.nextDueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return (
        <div>
          <p className="font-mono text-xs">{r.nextDueDate}</p>
          <p className={`text-xs ${days <= 7 ? 'text-red-400' : days <= 30 ? 'text-amber-400' : 'text-slate-500'}`}>
            {days > 0 ? `${days} days` : 'Overdue'}
          </p>
        </div>
      )
    }},
    { key: 'lastCompletedDate', header: 'Last Completed', render: (r) => <span className="font-mono text-xs text-slate-400">{r.lastCompletedDate ?? 'Never'}</span> },
    { key: 'owner', header: 'Owner', render: (r) => <span className="text-xs text-slate-400">{r.owner}</span> },
    { key: 'riskLevel', header: 'Risk', render: (r) => <Badge variant={RISK_VARIANT[r.riskLevel]}>{r.riskLevel}</Badge> },
    { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status === 'active' ? 'success' : 'muted'}>{r.status}</Badge> },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Compliance Obligations</h1>
        <p className="text-sm text-slate-400 mt-0.5">{obligations.length} obligations · {upcoming} due within 30 days</p>
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <DataTable columns={columns} data={obligations} rowKey={(r) => r.id} loading={loading} emptyMessage="No obligations" />
      </div>
    </div>
  )
}
