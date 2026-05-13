import { useContracts } from '../hooks/useContracts'
import { DataTable } from '../../../components/ui/DataTable'
import { Badge } from '../../../components/ui/Badge'
import { formatCurrency } from '../../../platform/types/core'
import type { RevenueContract } from '../types'
import type { Column } from '../../../components/ui/DataTable'

export function ContractList() {
  const { contracts, loading } = useContracts()

  const totalRecognized = contracts.reduce((s, c) => s + c.recognizedRevenue, 0)
  const totalDeferred = contracts.reduce((s, c) => s + c.deferredRevenue, 0)

  const columns: Column<RevenueContract>[] = [
    { key: 'contractNumber', header: 'Contract #', render: (r) => <span className="font-mono text-blue-400">{r.contractNumber}</span> },
    { key: 'customerName', header: 'Customer', render: (r) => <span className="text-slate-200">{r.customerName}</span> },
    { key: 'contractDate', header: 'Date', render: (r) => <span className="font-mono text-xs">{r.contractDate}</span> },
    { key: 'totalTransactionPrice', header: 'Total TTP', align: 'right' as const, render: (r) => <span className="font-mono text-sm">{formatCurrency(r.totalTransactionPrice, r.currency)}</span> },
    { key: 'recognizedRevenue', header: 'Recognized', align: 'right' as const, render: (r) => <span className="font-mono text-sm text-green-400">{formatCurrency(r.recognizedRevenue, r.currency)}</span> },
    { key: 'deferredRevenue', header: 'Deferred', align: 'right' as const, render: (r) => <span className="font-mono text-sm text-amber-400">{formatCurrency(r.deferredRevenue, r.currency)}</span> },
    { key: 'obligations', header: 'POBs', render: (r) => <span className="text-xs text-slate-400">{r.obligations.length} obligations</span> },
    { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status === 'active' ? 'success' : r.status === 'completed' ? 'muted' : 'warning'}>{r.status}</Badge> },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Revenue Contracts (ASC 606)</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          {contracts.length} contracts · {formatCurrency(totalRecognized, 'USD')} recognized · {formatCurrency(totalDeferred, 'USD')} deferred
        </p>
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <DataTable columns={columns} data={contracts} rowKey={(r) => r.id} loading={loading} emptyMessage="No revenue contracts" />
      </div>
    </div>
  )
}
