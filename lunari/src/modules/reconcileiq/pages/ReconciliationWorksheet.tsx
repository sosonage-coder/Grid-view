import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ReconcileIQService } from '../reconcileiq.service'
import { AuthService } from '../../../platform/services/auth.service'
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { formatCurrency } from '../../../platform/types/core'
import type { ReconWorksheet, ReconItem } from '../types'

export function ReconciliationWorksheet() {
  const { id } = useParams<{ id: string }>()
  const [worksheet, setWorksheet] = useState<ReconWorksheet | null>(null)
  const [items, setItems] = useState<ReconItem[]>([])
  const ctx = AuthService.getServiceContext()

  useEffect(() => {
    if (!id) return
    ReconcileIQService.getWorksheet(ctx, id).then((ws) => {
      setWorksheet(ws)
      ReconcileIQService.getItems(ws.id).then(setItems)
    })
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!worksheet) return <div className="text-slate-500 text-sm">Loading...</div>

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-xl font-bold text-slate-100">{worksheet.accountName}</h1>

      <div className="grid grid-cols-3 gap-3">
        <Card><p className="text-xs text-slate-500">GL Balance</p><p className="font-mono font-bold text-slate-100 text-lg">{formatCurrency(worksheet.glBalance, worksheet.currency)}</p></Card>
        <Card><p className="text-xs text-slate-500">Reconciled</p><p className="font-mono font-bold text-green-400 text-lg">{formatCurrency(worksheet.reconciledBalance, worksheet.currency)}</p></Card>
        <Card><p className="text-xs text-slate-500">Unreconciled</p><p className={`font-mono font-bold text-lg ${worksheet.unreconciledBalance !== 0 ? 'text-amber-400' : 'text-green-400'}`}>{formatCurrency(worksheet.unreconciledBalance, worksheet.currency)}</p></Card>
      </div>

      <Card padding="none">
        <CardHeader className="px-4 pt-4 pb-3">
          <CardTitle>Reconciling Items</CardTitle>
          <Badge variant={items.length === 0 ? 'success' : 'warning'}>{items.length} items</Badge>
        </CardHeader>
        {items.length === 0 ? (
          <p className="text-center text-slate-500 text-sm py-8">No reconciling items — balance reconciles to zero</p>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <p className="text-slate-200">{item.description}</p>
                  <p className="text-xs text-slate-500">{item.transactionDate}</p>
                </div>
                <span className={`font-mono font-medium ${item.amount >= 0 ? 'text-slate-200' : 'text-red-400'}`}>{formatCurrency(item.amount, item.currency)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
