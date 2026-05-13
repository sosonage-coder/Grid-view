import { useAudit } from '../hooks/useAudit'
import { DataTable } from '../../../components/ui/DataTable'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import type { PBCItem, PBCStatus, PBCPriority } from '../types'
import type { Column } from '../../../components/ui/DataTable'

const STATUS_VARIANT: Record<PBCStatus, 'muted' | 'warning' | 'info' | 'primary' | 'success' | 'danger' | 'default'> = {
  open: 'danger', in_progress: 'warning', submitted: 'info', under_review: 'primary', accepted: 'success', rejected: 'danger',
}

const PRIORITY_VARIANT: Record<PBCPriority, 'danger' | 'warning' | 'info' | 'muted'> = {
  urgent: 'danger', high: 'warning', normal: 'info', low: 'muted',
}

export function PBCList() {
  const { pbcItems, loading } = useAudit('2024')

  const open = pbcItems.filter((i) => ['open', 'in_progress'].includes(i.status)).length
  const submitted = pbcItems.filter((i) => i.status === 'submitted').length
  const accepted = pbcItems.filter((i) => i.status === 'accepted').length

  const columns: Column<PBCItem>[] = [
    { key: 'requestNumber', header: 'PBC #', render: (r) => <span className="font-mono text-blue-400">{r.requestNumber}</span> },
    { key: 'category', header: 'Category', render: (r) => <span className="text-xs text-slate-400">{r.category}</span> },
    { key: 'title', header: 'Request', render: (r) => <div><p className="text-slate-200 font-medium">{r.title}</p><p className="text-xs text-slate-500 truncate max-w-xs">{r.description}</p></div> },
    { key: 'assignedTo', header: 'Assigned To', render: (r) => <span className="text-xs text-slate-400">{r.assignedTo}</span> },
    { key: 'dueDate', header: 'Due Date', render: (r) => {
      const overdue = r.dueDate < new Date().toISOString().slice(0, 10) && !['accepted', 'rejected'].includes(r.status)
      return <span className={`font-mono text-xs ${overdue ? 'text-red-400' : ''}`}>{r.dueDate}</span>
    }},
    { key: 'priority', header: 'Priority', render: (r) => <Badge variant={PRIORITY_VARIANT[r.priority]}>{r.priority}</Badge> },
    { key: 'status', header: 'Status', render: (r) => <Badge variant={STATUS_VARIANT[r.status]}>{r.status.replace('_', ' ')}</Badge> },
    { key: 'evidence', header: 'Evidence', render: (r) => <span className="text-xs text-slate-400">{r.evidence.length} item(s)</span> },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">PBC Requests — Audit 2024</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {pbcItems.length} total · {open} open · {submitted} submitted · {accepted} accepted
          </p>
        </div>
        <Button variant="primary" size="sm">New PBC Item</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Open / In Progress', value: open, color: 'text-red-400' },
          { label: 'Submitted for Review', value: submitted, color: 'text-amber-400' },
          { label: 'Accepted', value: accepted, color: 'text-green-400' },
        ].map((s) => (
          <div key={s.label} className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-center">
            <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <DataTable columns={columns} data={pbcItems} rowKey={(r) => r.id} loading={loading} emptyMessage="No PBC items" />
      </div>
    </div>
  )
}
