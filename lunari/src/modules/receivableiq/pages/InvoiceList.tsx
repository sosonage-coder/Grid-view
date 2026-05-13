import { useState } from 'react'
import { Search, Plus, AlertTriangle } from 'lucide-react'
import { useReceivables } from '../hooks/useReceivables'
import { DataTable } from '../../../components/ui/DataTable'
import { ARStatusChip } from '../../../components/ui/StatusChip'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { formatCurrency } from '../../../platform/types/core'
import { useCurrentUser } from '../../../platform/hooks/useCurrentUser'
import type { ARInvoice } from '../types'
import type { Column } from '../../../components/ui/DataTable'

export function ARInvoiceList() {
  const [search, setSearch] = useState('')
  const { invoices, loading } = useReceivables({ search })
  const { can } = useCurrentUser()
  const today = new Date().toISOString().slice(0, 10)

  const totalOutstanding = invoices.filter((i) => !['paid', 'void', 'written_off'].includes(i.status)).reduce((s, i) => s + i.outstandingAmount, 0)
  const overdueCount = invoices.filter((i) => i.dueDate < today && !['paid', 'void', 'written_off', 'draft'].includes(i.status)).length

  const columns: Column<ARInvoice>[] = [
    { key: 'invoiceNumber', header: 'Invoice #', render: (row) => <span className="font-mono text-blue-400">{row.invoiceNumber}</span> },
    { key: 'customerName', header: 'Customer', render: (row) => <span className="text-slate-200">{row.customerName}</span> },
    { key: 'invoiceDate', header: 'Date', render: (row) => <span className="font-mono text-xs">{row.invoiceDate}</span> },
    {
      key: 'dueDate', header: 'Due',
      render: (row) => {
        const overdue = row.dueDate < today && !['paid', 'void', 'written_off'].includes(row.status)
        return (
          <span className={`font-mono text-xs flex items-center gap-1 ${overdue ? 'text-red-400' : ''}`}>
            {overdue && <AlertTriangle className="h-3 w-3" />}{row.dueDate}
          </span>
        )
      },
    },
    { key: 'totalAmount', header: 'Total', align: 'right' as const, render: (row) => <span className="font-mono text-sm">{formatCurrency(row.totalAmount, row.currency)}</span> },
    { key: 'outstandingAmount', header: 'Outstanding', align: 'right' as const, render: (row) => <span className="font-mono text-sm text-amber-400">{formatCurrency(row.outstandingAmount, row.currency)}</span> },
    { key: 'status', header: 'Status', render: (row) => <ARStatusChip status={row.status} /> },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Customer Invoices</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {invoices.length} invoices · {formatCurrency(totalOutstanding, 'USD')} outstanding
            {overdueCount > 0 && <span className="text-red-400 ml-2">· {overdueCount} overdue</span>}
          </p>
        </div>
        {can('ar:create') && <Button variant="primary" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>New Invoice</Button>}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Outstanding', value: formatCurrency(totalOutstanding, 'USD'), color: 'text-amber-400' },
          { label: 'Overdue', value: overdueCount, color: 'text-red-400' },
          { label: 'Paid (this period)', value: invoices.filter((i) => i.status === 'paid').length, color: 'text-green-400' },
        ].map((s) => (
          <Card key={s.label} className="text-center">
            <p className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          placeholder="Search invoices or customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <DataTable columns={columns} data={invoices} rowKey={(r) => r.id} loading={loading} emptyMessage="No invoices found" />
      </div>
    </div>
  )
}
