import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card'
import { APStatusChip } from '../../../components/ui/StatusChip'
import { ApprovalActions } from '../../../components/governance/ApprovalActions'
import { AuditTrail } from '../../../components/governance/AuditTrail'
import { PeriodLockBanner } from '../../../components/governance/PeriodLockBanner'
import { PayIQService } from '../payiq.service'
import { AuthService } from '../../../platform/services/auth.service'
import { useCurrentUser } from '../../../platform/hooks/useCurrentUser'
import { usePeriodLock } from '../../../platform/hooks/usePeriodLock'
import { formatCurrency } from '../../../platform/types/core'
import type { APInvoice } from '../types'

export function InvoiceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, can } = useCurrentUser()
  const { period, isLocked } = usePeriodLock()
  const [invoice, setInvoice] = useState<APInvoice | null>(null)
  const [loading, setLoading] = useState(true)
  const ctx = AuthService.getServiceContext()

  const load = async () => {
    if (!id) return
    setLoading(true)
    try {
      setInvoice(await PayIQService.getInvoice(ctx, id))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className="text-slate-500 text-sm">Loading...</div>
  if (!invoice) return <div className="text-red-400">Invoice not found</div>

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate(-1)}>
          Back
        </Button>
        <div className="flex-1" />
        <APStatusChip status={invoice.status} />
      </div>

      <PeriodLockBanner period={period} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2" padding="lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-400" />
              <div>
                <CardTitle>{invoice.invoiceNumber}</CardTitle>
                <p className="text-sm text-slate-400 mt-0.5">{invoice.vendorName}</p>
              </div>
            </div>
            <ApprovalActions
              status={invoice.status}
              preparedBy={invoice.preparedBy}
              currentUserId={user.id}
              isLocked={isLocked}
              onApprove={can('ap:approve') ? async () => { await PayIQService.approveInvoice(ctx, invoice.id); await load() } : undefined}
              onReject={can('ap:approve') ? async (r) => { await PayIQService.rejectInvoice(ctx, invoice.id, r); await load() } : undefined}
              onPost={can('ap:post') ? async () => { await PayIQService.postInvoice(ctx, invoice.id); await load() } : undefined}
            />
          </CardHeader>

          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div><p className="text-slate-500 text-xs">Invoice Date</p><p className="font-mono text-slate-200 mt-0.5">{invoice.invoiceDate}</p></div>
            <div><p className="text-slate-500 text-xs">Due Date</p><p className="font-mono text-slate-200 mt-0.5">{invoice.dueDate}</p></div>
            <div><p className="text-slate-500 text-xs">Currency</p><p className="font-mono text-slate-200 mt-0.5">{invoice.currency}</p></div>
            <div><p className="text-slate-500 text-xs">Prepared By</p><p className="text-slate-200 mt-0.5">{invoice.preparedBy}</p></div>
            {invoice.approvedBy && <div><p className="text-slate-500 text-xs">Approved By</p><p className="text-slate-200 mt-0.5">{invoice.approvedBy}</p></div>}
            {invoice.postedAt && <div><p className="text-slate-500 text-xs">Posted At</p><p className="font-mono text-slate-200 mt-0.5">{new Date(invoice.postedAt).toLocaleString()}</p></div>}
          </div>

          <div className="border border-slate-700 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/50">
                  <th className="text-left px-3 py-2 text-slate-400 font-medium">Description</th>
                  <th className="text-left px-3 py-2 text-slate-400 font-medium">Account</th>
                  <th className="text-right px-3 py-2 text-slate-400 font-medium">Qty</th>
                  <th className="text-right px-3 py-2 text-slate-400 font-medium">Unit Price</th>
                  <th className="text-right px-3 py-2 text-slate-400 font-medium">Tax</th>
                  <th className="text-right px-3 py-2 text-slate-400 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines.map((line) => (
                  <tr key={line.id} className="border-b border-slate-700/50">
                    <td className="px-3 py-2 text-slate-300">{line.description}</td>
                    <td className="px-3 py-2 font-mono text-slate-400">{line.accountCode}</td>
                    <td className="px-3 py-2 text-right font-mono">{line.quantity}</td>
                    <td className="px-3 py-2 text-right font-mono">{formatCurrency(line.unitPrice, invoice.currency)}</td>
                    <td className="px-3 py-2 text-right font-mono">{formatCurrency(line.taxAmount, invoice.currency)}</td>
                    <td className="px-3 py-2 text-right font-mono text-slate-200">{formatCurrency(line.amount + line.taxAmount, invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900/30 font-medium">
                  <td colSpan={5} className="px-3 py-2 text-slate-400 text-right">Subtotal</td>
                  <td className="px-3 py-2 text-right font-mono text-slate-200">{formatCurrency(invoice.subtotalAmount, invoice.currency)}</td>
                </tr>
                <tr className="bg-slate-900/30 font-medium">
                  <td colSpan={5} className="px-3 py-2 text-slate-400 text-right">Tax</td>
                  <td className="px-3 py-2 text-right font-mono text-slate-200">{formatCurrency(invoice.taxAmount, invoice.currency)}</td>
                </tr>
                <tr className="bg-slate-900/50 font-bold">
                  <td colSpan={5} className="px-3 py-2 text-slate-200 text-right">Total</td>
                  <td className="px-3 py-2 text-right font-mono text-slate-100 text-sm">{formatCurrency(invoice.totalAmount, invoice.currency)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {invoice.notes && (
            <div className="mt-4 text-xs text-slate-400 bg-slate-900/50 rounded p-3">
              <span className="font-medium">Notes:</span> {invoice.notes}
            </div>
          )}
          {invoice.rejectionReason && (
            <div className="mt-4 text-xs text-red-400 bg-red-900/20 border border-red-800/30 rounded p-3">
              <span className="font-medium">Rejection reason:</span> {invoice.rejectionReason}
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Audit Trail</CardTitle></CardHeader>
            <AuditTrail resourceId={invoice.id} resourceType="ap_invoice" />
          </Card>
        </div>
      </div>
    </div>
  )
}
