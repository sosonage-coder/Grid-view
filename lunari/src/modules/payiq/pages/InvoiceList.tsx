import { useState } from 'react'
import { Search, Filter, Plus, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useInvoices } from '../hooks/useInvoices'
import { DataTable } from '../../../components/ui/DataTable'
import { APStatusChip } from '../../../components/ui/StatusChip'
import { Button } from '../../../components/ui/Button'
import { PeriodLockBanner } from '../../../components/governance/PeriodLockBanner'
import { ApprovalActions } from '../../../components/governance/ApprovalActions'
import { usePeriodLock } from '../../../platform/hooks/usePeriodLock'
import { useCurrentUser } from '../../../platform/hooks/useCurrentUser'
import { formatCurrency } from '../../../platform/types/core'
import type { APInvoice, APInvoiceStatus } from '../types'
import type { Column } from '../../../components/ui/DataTable'

const STATUS_OPTIONS: APInvoiceStatus[] = ['draft', 'pending_approval', 'approved', 'posted', 'paid', 'void', 'rejected']

export function InvoiceList() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<APInvoiceStatus | undefined>()
  const { invoices, loading, approve, reject, post } = useInvoices({ search, status: statusFilter })
  const { period, isLocked } = usePeriodLock()
  const { user, can } = useCurrentUser()
  const navigate = useNavigate()

  const totalOutstanding = invoices
    .filter((i) => !['paid', 'void'].includes(i.status))
    .reduce((s, i) => s + i.outstandingAmount, 0)

  const today = new Date().toISOString().slice(0, 10)
  const overdueCount = invoices.filter((i) => i.dueDate < today && !['paid', 'void'].includes(i.status)).length

  const columns: Column<APInvoice>[] = [
    { key: 'invoiceNumber', header: 'Invoice #', render: (row) => <span className="font-mono text-blue-400">{row.invoiceNumber}</span> },
    { key: 'vendorName', header: 'Vendor', render: (row) => <span className="text-slate-200">{row.vendorName}</span> },
    { key: 'invoiceDate', header: 'Invoice Date', render: (row) => <span className="font-mono text-xs">{row.invoiceDate}</span> },
    {
      key: 'dueDate', header: 'Due Date',
      render: (row) => {
        const overdue = row.dueDate < today && !['paid', 'void'].includes(row.status)
        return (
          <span className={`font-mono text-xs flex items-center gap-1 ${overdue ? 'text-red-400' : ''}`}>
            {overdue && <AlertTriangle className="h-3 w-3" />}
            {row.dueDate}
          </span>
        )
      },
    },
    {
      key: 'totalAmount', header: 'Total', align: 'right' as const,
      render: (row) => <span className="font-mono text-sm">{formatCurrency(row.totalAmount, row.currency)}</span>,
    },
    {
      key: 'outstandingAmount', header: 'Outstanding', align: 'right' as const,
      render: (row) => <span className="font-mono text-sm text-amber-400">{formatCurrency(row.outstandingAmount, row.currency)}</span>,
    },
    { key: 'status', header: 'Status', render: (row) => <APStatusChip status={row.status} /> },
    {
      key: 'actions', header: '', align: 'right' as const,
      render: (row) => (
        <div onClick={(e) => e.stopPropagation()}>
          <ApprovalActions
            status={row.status}
            preparedBy={row.preparedBy}
            currentUserId={user.id}
            isLocked={isLocked}
            onApprove={can('ap:approve') ? () => approve(row.id) : undefined}
            onReject={can('ap:approve') ? (reason) => reject(row.id, reason) : undefined}
            onPost={can('ap:post') ? () => post(row.id) : undefined}
            onSubmit={row.preparedBy === user.id && can('ap:create') ? () => Promise.resolve() : undefined}
          />
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">AP Invoices</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {invoices.length} invoices · {formatCurrency(totalOutstanding, 'USD')} outstanding
            {overdueCount > 0 && <span className="text-red-400 ml-2">· {overdueCount} overdue</span>}
          </p>
        </div>
        {can('ap:create') && (
          <Button variant="primary" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>
            New Invoice
          </Button>
        )}
      </div>

      <PeriodLockBanner period={period} />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            placeholder="Search invoices or vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <select
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
            value={statusFilter ?? ''}
            onChange={(e) => setStatusFilter((e.target.value as APInvoiceStatus) || undefined)}
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <DataTable
          columns={columns}
          data={invoices}
          rowKey={(r) => r.id}
          loading={loading}
          emptyMessage="No invoices found"
          onRowClick={(row) => navigate(`/payiq/invoices/${row.id}`)}
        />
      </div>
    </div>
  )
}
