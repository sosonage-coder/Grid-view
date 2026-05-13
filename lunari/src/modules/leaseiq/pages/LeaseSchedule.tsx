import { useLeases } from '../hooks/useLeases'
import { Card, CardHeader } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { formatCurrency } from '../../../platform/types/core'

export function LeaseSchedule() {
  const { leases, loading } = useLeases()

  if (loading) return <div className="text-slate-500 text-sm">Loading...</div>

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-100">Lease Payment Schedules</h1>
      {leases.map((lease) => (
        <Card key={lease.id}>
          <CardHeader>
            <div>
              <p className="text-sm font-bold text-slate-200">{lease.leaseNumber} — {lease.description}</p>
              <p className="text-xs text-slate-500">Discount rate: {(lease.discountRate * 100).toFixed(2)}% · {lease.termMonths} months</p>
            </div>
            <Badge variant={lease.leaseType === 'finance' ? 'primary' : 'default'}>{lease.leaseType}</Badge>
          </CardHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div><p className="text-slate-500">ROU Asset (gross)</p><p className="font-mono text-slate-200">{formatCurrency(lease.rightOfUseAsset, lease.currency)}</p></div>
            <div><p className="text-slate-500">Accum. Amortization</p><p className="font-mono text-slate-400">({formatCurrency(lease.accumulatedAmortization, lease.currency)})</p></div>
            <div><p className="text-slate-500">Current Liability</p><p className="font-mono text-amber-400">{formatCurrency(lease.currentLiability, lease.currency)}</p></div>
            <div><p className="text-slate-500">LT Liability</p><p className="font-mono text-slate-300">{formatCurrency(lease.longTermLiability, lease.currency)}</p></div>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            <span>Monthly payment: </span>
            <span className="font-mono text-slate-300">{formatCurrency(lease.monthlyPayment, lease.currency)}</span>
            <span> · Expires: </span>
            <span className="font-mono text-slate-300">{lease.expirationDate}</span>
            {lease.renewalOptions > 0 && <span> · {lease.renewalOptions} months renewal option</span>}
          </div>
        </Card>
      ))}
    </div>
  )
}
