import { useContracts } from '../hooks/useContracts'
import { Card, CardHeader } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { formatCurrency } from '../../../platform/types/core'

export function RevenueSchedule() {
  const { contracts, loading } = useContracts()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-100">Revenue Recognition Schedule</h1>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-32 bg-slate-800 rounded-lg animate-pulse" />)}</div>
      ) : (
        contracts.map((contract) => (
          <Card key={contract.id}>
            <CardHeader>
              <div>
                <p className="text-sm font-bold text-slate-200">{contract.contractNumber} — {contract.customerName}</p>
                <p className="text-xs text-slate-500 mt-0.5">{contract.obligations.length} performance obligations</p>
              </div>
              <Badge variant={contract.status === 'active' ? 'success' : 'muted'}>{contract.status}</Badge>
            </CardHeader>

            <div className="space-y-3">
              {contract.obligations.map((ob) => (
                <div key={ob.id} className="bg-slate-900/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-slate-200">{ob.description}</p>
                    <Badge variant={ob.status === 'fully_satisfied' ? 'success' : ob.status === 'partially_satisfied' ? 'warning' : 'muted'}>
                      {ob.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><p className="text-slate-500">Allocated TTP</p><p className="font-mono text-slate-200">{formatCurrency(ob.allocatedTransactionPrice, contract.currency)}</p></div>
                    <div><p className="text-slate-500">Recognized</p><p className="font-mono text-green-400">{formatCurrency(ob.recognizedAmount, contract.currency)}</p></div>
                    <div><p className="text-slate-500">Deferred</p><p className="font-mono text-amber-400">{formatCurrency(ob.deferredAmount, contract.currency)}</p></div>
                  </div>
                  <div className="mt-2">
                    <div className="h-1.5 bg-slate-700 rounded-full">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${ob.completionPct}%` }} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{ob.completionPct}% complete · {ob.recognitionMethod.replace('_', ' ')}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))
      )}
    </div>
  )
}
