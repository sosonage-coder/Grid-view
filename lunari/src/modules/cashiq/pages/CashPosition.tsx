import { useBankFeeds } from '../hooks/useBankFeeds'
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card'
import { DataTable } from '../../../components/ui/DataTable'
import { Badge } from '../../../components/ui/Badge'
import { formatCurrency } from '../../../platform/types/core'
import type { BankAccount, BankTransaction } from '../types'
import type { Column } from '../../../components/ui/DataTable'

export function CashPosition() {
  const { accounts, transactions, position, loading } = useBankFeeds()

  const accountColumns: Column<BankAccount>[] = [
    { key: 'name', header: 'Account', render: (r) => <div><p className="text-slate-200 font-medium">{r.name}</p><p className="text-xs text-slate-500">{r.bankName} · {r.accountNumber}</p></div> },
    { key: 'accountType', header: 'Type', render: (r) => <Badge variant="default">{r.accountType.replace('_', ' ')}</Badge> },
    { key: 'currency', header: 'Currency', render: (r) => <span className="font-mono text-sm">{r.currency}</span> },
    { key: 'currentBalance', header: 'Current Balance', align: 'right' as const, render: (r) => <span className={`font-mono font-bold text-sm ${r.currentBalance >= 0 ? 'text-slate-100' : 'text-red-400'}`}>{formatCurrency(r.currentBalance, r.currency)}</span> },
    { key: 'availableBalance', header: 'Available', align: 'right' as const, render: (r) => <span className="font-mono text-sm text-green-400">{formatCurrency(r.availableBalance, r.currency)}</span> },
    { key: 'lastReconciledDate', header: 'Last Reconciled', render: (r) => <span className="font-mono text-xs text-slate-400">{r.lastReconciledDate ?? 'Never'}</span> },
  ]

  const txColumns: Column<BankTransaction>[] = [
    { key: 'transactionDate', header: 'Date', render: (r) => <span className="font-mono text-xs">{r.transactionDate}</span> },
    { key: 'description', header: 'Description', render: (r) => <span className="text-slate-300">{r.description}</span> },
    { key: 'reference', header: 'Reference', render: (r) => <span className="font-mono text-xs text-slate-500">{r.reference ?? '—'}</span> },
    { key: 'amount', header: 'Amount', align: 'right' as const, render: (r) => <span className={`font-mono text-sm font-medium ${r.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>{r.type === 'credit' ? '+' : '-'}{formatCurrency(r.amount, r.currency)}</span> },
    { key: 'balance', header: 'Balance', align: 'right' as const, render: (r) => <span className="font-mono text-sm text-slate-300">{formatCurrency(r.balance, r.currency)}</span> },
    { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status === 'reconciled' ? 'success' : 'warning'}>{r.status}</Badge> },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Cash Position</h1>
        <p className="text-sm text-slate-400 mt-0.5">As of {new Date().toLocaleDateString()}</p>
      </div>

      {position && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <p className="text-xs text-slate-500 uppercase">Total Cash Balance</p>
            <p className="text-3xl font-bold font-mono text-green-400 mt-1">{formatCurrency(position.totalBalance, 'USD')}</p>
          </Card>
          <Card>
            <p className="text-xs text-slate-500 uppercase">Available Funds</p>
            <p className="text-3xl font-bold font-mono text-blue-400 mt-1">{formatCurrency(position.totalAvailable, 'USD')}</p>
          </Card>
        </div>
      )}

      <Card padding="none">
        <CardHeader className="px-4 pt-4 pb-3">
          <CardTitle>Bank Accounts</CardTitle>
          <span className="text-sm font-mono text-slate-300">{accounts.length} accounts</span>
        </CardHeader>
        <DataTable columns={accountColumns} data={accounts} rowKey={(r) => r.id} loading={loading} emptyMessage="No bank accounts" />
      </Card>

      <Card padding="none">
        <CardHeader className="px-4 pt-4 pb-3">
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <DataTable columns={txColumns} data={transactions.slice(0, 20)} rowKey={(r) => r.id} loading={loading} emptyMessage="No transactions" compact />
      </Card>
    </div>
  )
}
