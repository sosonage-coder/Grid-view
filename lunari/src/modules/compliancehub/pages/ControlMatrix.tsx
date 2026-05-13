import { useCompliance } from '../hooks/useCompliance'
import { DataTable } from '../../../components/ui/DataTable'
import { Badge } from '../../../components/ui/Badge'
import { Card } from '../../../components/ui/Card'
import type { Control, RiskLevel, ControlStatus } from '../types'
import type { Column } from '../../../components/ui/DataTable'

const RISK_VARIANT: Record<RiskLevel, 'danger' | 'warning' | 'info' | 'muted'> = { critical: 'danger', high: 'warning', medium: 'info', low: 'muted' }
const STATUS_VARIANT: Record<ControlStatus, 'success' | 'warning' | 'danger' | 'muted'> = { effective: 'success', deficient: 'warning', material_weakness: 'danger', not_tested: 'muted' }

export function ControlMatrix() {
  const { controls, matrix, loading } = useCompliance()

  const columns: Column<Control>[] = [
    { key: 'controlId', header: 'ID', render: (r) => <span className="font-mono text-blue-400">{r.controlId}</span> },
    { key: 'name', header: 'Control', render: (r) => <div><p className="text-slate-200 font-medium">{r.name}</p><p className="text-xs text-slate-500">{r.process}</p></div> },
    { key: 'type', header: 'Type', render: (r) => <Badge variant="default">{r.type}</Badge> },
    { key: 'frequency', header: 'Frequency', render: (r) => <span className="text-xs text-slate-400 capitalize">{r.frequency.replace('_', ' ')}</span> },
    { key: 'riskLevel', header: 'Risk', render: (r) => <Badge variant={RISK_VARIANT[r.riskLevel]}>{r.riskLevel}</Badge> },
    { key: 'status', header: 'Status', render: (r) => <Badge variant={STATUS_VARIANT[r.status]}>{r.status.replace('_', ' ')}</Badge> },
    { key: 'lastTestedDate', header: 'Last Tested', render: (r) => <span className="font-mono text-xs text-slate-400">{r.lastTestedDate ?? 'Not tested'}</span> },
    { key: 'nextTestDate', header: 'Next Test', render: (r) => <span className="font-mono text-xs text-slate-400">{r.nextTestDate ?? '—'}</span> },
    { key: 'owner', header: 'Owner', render: (r) => <span className="text-xs text-slate-400">{r.owner}</span> },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Control Matrix</h1>
        <p className="text-sm text-slate-400 mt-0.5">{controls.length} controls across all processes</p>
      </div>

      {matrix && (
        <div className="grid grid-cols-4 gap-3">
          <Card className="text-center">
            <p className="text-2xl font-bold font-mono text-green-400">{matrix.effectiveControls}</p>
            <p className="text-xs text-slate-500 mt-1">Effective</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold font-mono text-amber-400">{matrix.deficientControls}</p>
            <p className="text-xs text-slate-500 mt-1">Deficient</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold font-mono text-red-400">{matrix.materialWeaknesses}</p>
            <p className="text-xs text-slate-500 mt-1">Material Weakness</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold font-mono text-slate-400">{matrix.notTested}</p>
            <p className="text-xs text-slate-500 mt-1">Not Tested</p>
          </Card>
        </div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <DataTable columns={columns} data={controls} rowKey={(r) => r.id} loading={loading} emptyMessage="No controls" />
      </div>
    </div>
  )
}
