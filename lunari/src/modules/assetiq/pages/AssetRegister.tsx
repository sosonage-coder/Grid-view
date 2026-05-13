import { useAssets } from '../hooks/useAssets'
import { DataTable } from '../../../components/ui/DataTable'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { formatCurrency } from '../../../platform/types/core'
import type { FixedAsset } from '../types'
import type { Column } from '../../../components/ui/DataTable'

export function AssetRegister() {
  const { assets, loading } = useAssets()

  const totalNBV = assets.filter((a) => a.status === 'active').reduce((s, a) => s + a.netBookValue, 0)
  const totalCost = assets.reduce((s, a) => s + a.acquisitionCost, 0)

  const columns: Column<FixedAsset>[] = [
    { key: 'assetNumber', header: 'Asset #', render: (r) => <span className="font-mono text-blue-400">{r.assetNumber}</span> },
    { key: 'name', header: 'Asset', render: (r) => <div><p className="text-slate-200">{r.name}</p><p className="text-xs text-slate-500">{r.category} · {r.location ?? '—'}</p></div> },
    { key: 'inServiceDate', header: 'In Service', render: (r) => <span className="font-mono text-xs">{r.inServiceDate}</span> },
    { key: 'acquisitionCost', header: 'Cost', align: 'right' as const, render: (r) => <span className="font-mono text-sm">{formatCurrency(r.acquisitionCost, r.currency)}</span> },
    { key: 'accumulatedDepreciation', header: 'Accum. Depr.', align: 'right' as const, render: (r) => <span className="font-mono text-sm text-slate-400">({formatCurrency(r.accumulatedDepreciation, r.currency)})</span> },
    { key: 'netBookValue', header: 'Net Book Value', align: 'right' as const, render: (r) => <span className={`font-mono font-bold text-sm ${r.netBookValue > 0 ? 'text-slate-100' : 'text-slate-500'}`}>{formatCurrency(r.netBookValue, r.currency)}</span> },
    { key: 'depreciationMethod', header: 'Method', render: (r) => <span className="text-xs text-slate-400">{r.depreciationMethod.replace('_', '-')}</span> },
    { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status === 'active' ? 'success' : r.status === 'fully_depreciated' ? 'muted' : r.status === 'disposed' ? 'danger' : 'warning'}>{r.status.replace('_', ' ')}</Badge> },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Fixed Asset Register</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {assets.length} assets · Cost: {formatCurrency(totalCost, 'USD')} · NBV: {formatCurrency(totalNBV, 'USD')}
          </p>
        </div>
        <Button variant="primary" size="sm">Add Asset</Button>
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <DataTable columns={columns} data={assets} rowKey={(r) => r.id} loading={loading} emptyMessage="No assets" />
      </div>
    </div>
  )
}
