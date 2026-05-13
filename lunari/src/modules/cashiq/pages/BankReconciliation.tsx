import { useBankFeeds } from '../hooks/useBankFeeds'
import { Card, CardHeader } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { formatCurrency } from '../../../platform/types/core'
import { CheckCircle, AlertTriangle } from 'lucide-react'

export function BankReconciliation() {
  const { accounts, transactions, loading } = useBankFeeds()
  const unreconciledCount = transactions.filter((t) => t.status === 'unreconciled').length

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Bank Reconciliation</h1>
          <p className="text-sm text-slate-400 mt-0.5">{unreconciledCount} unreconciled transactions</p>
        </div>
        <Button variant="primary" size="sm">New Reconciliation</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {accounts.map((account) => {
          const acctTxns = transactions.filter((t) => t.bankAccountId === account.id)
          const unreconciled = acctTxns.filter((t) => t.status === 'unreconciled').length
          const isReconciledThisMonth = account.lastReconciledDate && account.lastReconciledDate >= new Date().toISOString().slice(0, 7)

          return (
            <Card key={account.id}>
              <CardHeader>
                <div>
                  <p className="text-sm font-medium text-slate-200">{account.name}</p>
                  <p className="text-xs text-slate-500">{account.bankName} · {account.accountNumber}</p>
                </div>
                <Badge variant={unreconciled === 0 ? 'success' : 'warning'}>
                  {unreconciled === 0 ? 'Reconciled' : `${unreconciled} unreconciled`}
                </Badge>
              </CardHeader>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">GL Balance</span>
                  <span className="font-mono text-slate-200">{formatCurrency(account.currentBalance, account.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Reconciled</span>
                  <span className="font-mono text-xs text-slate-400">{account.lastReconciledDate ?? 'Never'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">This period status</span>
                  <span className="flex items-center gap-1 text-xs">
                    {isReconciledThisMonth
                      ? <><CheckCircle className="h-3.5 w-3.5 text-green-400" /><span className="text-green-400">Complete</span></>
                      : <><AlertTriangle className="h-3.5 w-3.5 text-amber-400" /><span className="text-amber-400">Pending</span></>}
                  </span>
                </div>
              </div>

              {!loading && acctTxns.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <p className="text-xs text-slate-500 mb-2">Recent transactions</p>
                  {acctTxns.slice(0, 3).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between text-xs py-1">
                      <span className="text-slate-400 truncate">{tx.description}</span>
                      <span className={`font-mono ml-2 ${tx.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount, tx.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <Button variant="secondary" size="sm" className="w-full mt-3">
                Open Reconciliation
              </Button>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
