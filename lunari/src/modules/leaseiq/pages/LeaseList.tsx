import { useLeases } from '../hooks/useLeases'
import { DataTable } from '../../../components/ui/DataTable'
import { Badge } from '../../../components/ui/Badge'
import { formatCurrency } from '../../../platform/types/core'
import type { Lease } from '../types'
import type { Column } from '../../../components/ui/DataTable'

export function LeaseList() {
  const { leases, loading } = useLeases()

  const totalROU = leases.reduce((s, l) => s + (l.rightOfUseAsset - l.accumulatedAmortization), 0)
  const totalLiability = leases.reduce((s, l) => s + l.currentLiability + l.longTermLiability, 0)

  const columns: Column<Lease>[] = [
    { key: 'leaseNumber', header: 'Lease #', render: (r) => <span className="font-mono text-blue-400">{r.leaseNumber}</span> },
    { key: 'description', header: 'Description', render: (r) => <div><p className="text-slate-200">{r.description}</p><p className="text-xs text-slate-500">{r.lessor} · {r.assetCategory}</p></div> },
    { key: 'leaseType', header: 'Type', render: (r) => <Badge variant={r.leaseType === 'finance' ? 'primary' : 'default'}>{r.leaseType}</Badge> },
    { key: 'commencementDate', header: 'Start', render: (r) => <span className="font-mono text-xs">{r.commencementDate}</span> },
    { key: 'expirationDate', header: 'Expiry', render: (r) => <span className="font-mono text-xs">{r.expirationDate}</span> },
    { key: 'monthlyPayment', header: 'Monthly', align: 'right' as const, render: (r) => <span className="font-mono text-sm">{formatCurrency(r.monthlyPayment, r.currency)}</span> },
    { key: 'currentLiability', header: 'Current Liab.', align: 'right' as const, render: (r) => <span className="font-mono text-sm text-amber-400">{formatCurrency(r.currentLiability, r.currency)}</span> },
    { key: 'longTermLiability', header: 'LT Liab.', align: 'right' as const, render: (r) => <span className="font-mono text-sm text-slate-400">{formatCurrency(r.longTermLiability, r.currency)}</span> },
    { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status === 'active' ? 'success' : r.status === 'expired' ? 'muted' : 'warning'}>{r.status}</Badge> },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Lease Register (IFRS 16 / ASC 842)</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          {leases.filter((l) => l.status === 'active').length} active leases · ROU assets: {formatCurrency(totalROU, 'USD')} · Liability: {formatCurrency(totalLiability, 'USD')}
        </p>
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <DataTable columns={columns} data={leases} rowKey={(r) => r.id} loading={loading} emptyMessage="No leases" />
      </div>
    </div>
  )
}
