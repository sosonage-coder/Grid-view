import type { ServiceContext } from '../../platform/types/core'
import { AuditService } from '../../platform/services/audit.service'
import { PeriodService } from '../../platform/services/period.service'
import { LedgerEngine, generateId } from '../../engine/ledger.engine'
import { ApprovalEngine } from '../../engine/approval.engine'
import { PeriodEngine } from '../../engine/period.engine'
import type { APInvoice, APPayment, InvoiceFilters, APInvoiceStatus } from './types'
import type { Journal, JournalLine } from '../../platform/types/ledger'

// ─── Mock data ────────────────────────────────────────────────────────────────

const _invoices: Map<string, APInvoice> = new Map()
const _payments: Map<string, APPayment> = new Map()

;(function seed() {
  const now = new Date()
  const invoices: APInvoice[] = [
    {
      id: 'ap-inv-001', tenantId: 'tenant-acme', entityId: 'entity-us',
      vendorId: 'vendor-001', vendorName: 'TechParts Inc.',
      invoiceNumber: 'TP-2024-8821', invoiceDate: '2024-12-01', dueDate: '2024-12-31',
      receivedDate: '2024-12-02', currency: 'USD',
      subtotalAmount: 45000, taxAmount: 3600, totalAmount: 48600,
      paidAmount: 0, outstandingAmount: 48600,
      status: 'approved',
      lines: [
        { id: 'apl-001a', invoiceId: 'ap-inv-001', sequence: 1, description: 'Server hardware Q4', accountId: 'acc-5010', accountCode: '5010', accountName: 'IT Equipment', quantity: 10, unitPrice: 4500, amount: 45000, taxCode: 'STD', taxRate: 0.08, taxAmount: 3600 },
      ],
      journalId: null, approvedBy: 'user-manager', approvedAt: '2024-12-05T10:00:00Z',
      rejectedBy: null, rejectedAt: null, rejectionReason: null, postedAt: null,
      notes: 'Approved per budget PO-2024-142', attachmentUrl: null,
      preparedBy: 'user-ap-clerk', createdAt: '2024-12-02T09:00:00Z', updatedAt: '2024-12-05T10:00:00Z',
    },
    {
      id: 'ap-inv-002', tenantId: 'tenant-acme', entityId: 'entity-us',
      vendorId: 'vendor-002', vendorName: 'CloudHost Corp',
      invoiceNumber: 'CH-INV-00442', invoiceDate: '2024-12-15', dueDate: '2025-01-14',
      receivedDate: '2024-12-16', currency: 'USD',
      subtotalAmount: 12500, taxAmount: 0, totalAmount: 12500,
      paidAmount: 0, outstandingAmount: 12500,
      status: 'pending_approval',
      lines: [
        { id: 'apl-002a', invoiceId: 'ap-inv-002', sequence: 1, description: 'Cloud hosting Dec 2024', accountId: 'acc-5020', accountCode: '5020', accountName: 'SaaS & Cloud Services', quantity: 1, unitPrice: 12500, amount: 12500, taxCode: null, taxRate: 0, taxAmount: 0 },
      ],
      journalId: null, approvedBy: null, approvedAt: null,
      rejectedBy: null, rejectedAt: null, rejectionReason: null, postedAt: null,
      notes: null, attachmentUrl: null,
      preparedBy: 'user-ap-clerk', createdAt: '2024-12-16T11:00:00Z', updatedAt: '2024-12-16T11:00:00Z',
    },
    {
      id: 'ap-inv-003', tenantId: 'tenant-acme', entityId: 'entity-us',
      vendorId: 'vendor-003', vendorName: 'Office Supplies Ltd',
      invoiceNumber: 'OSL-9901', invoiceDate: '2024-11-20', dueDate: '2024-12-20',
      receivedDate: '2024-11-21', currency: 'USD',
      subtotalAmount: 3200, taxAmount: 256, totalAmount: 3456,
      paidAmount: 3456, outstandingAmount: 0,
      status: 'paid',
      lines: [
        { id: 'apl-003a', invoiceId: 'ap-inv-003', sequence: 1, description: 'Office supplies Nov 2024', accountId: 'acc-5030', accountCode: '5030', accountName: 'Office Supplies', quantity: 1, unitPrice: 3200, amount: 3200, taxCode: 'STD', taxRate: 0.08, taxAmount: 256 },
      ],
      journalId: 'jnl-ap-003', approvedBy: 'user-manager', approvedAt: '2024-11-25T14:00:00Z',
      rejectedBy: null, rejectedAt: null, rejectionReason: null, postedAt: '2024-11-26T09:00:00Z',
      notes: null, attachmentUrl: null,
      preparedBy: 'user-ap-clerk', createdAt: '2024-11-21T09:00:00Z', updatedAt: '2024-12-22T10:00:00Z',
    },
    {
      id: 'ap-inv-004', tenantId: 'tenant-acme', entityId: 'entity-us',
      vendorId: 'vendor-004', vendorName: 'Legal Associates LLC',
      invoiceNumber: 'LA-2024-0155', invoiceDate: '2024-12-10', dueDate: '2025-01-09',
      receivedDate: '2024-12-11', currency: 'USD',
      subtotalAmount: 22000, taxAmount: 0, totalAmount: 22000,
      paidAmount: 0, outstandingAmount: 22000,
      status: 'draft',
      lines: [
        { id: 'apl-004a', invoiceId: 'ap-inv-004', sequence: 1, description: 'Legal services Q4 2024', accountId: 'acc-5040', accountCode: '5040', accountName: 'Legal Fees', quantity: 1, unitPrice: 22000, amount: 22000, taxCode: null, taxRate: 0, taxAmount: 0 },
      ],
      journalId: null, approvedBy: null, approvedAt: null,
      rejectedBy: null, rejectedAt: null, rejectionReason: null, postedAt: null,
      notes: 'Need PO reference before approval', attachmentUrl: null,
      preparedBy: 'user-ap-clerk', createdAt: '2024-12-11T14:00:00Z', updatedAt: '2024-12-11T14:00:00Z',
    },
    {
      id: 'ap-inv-005', tenantId: 'tenant-acme', entityId: 'entity-us',
      vendorId: 'vendor-001', vendorName: 'TechParts Inc.',
      invoiceNumber: 'TP-2024-7730', invoiceDate: '2024-10-15', dueDate: '2024-11-14',
      receivedDate: '2024-10-16', currency: 'USD',
      subtotalAmount: 8900, taxAmount: 712, totalAmount: 9612,
      paidAmount: 9612, outstandingAmount: 0,
      status: 'paid',
      lines: [
        { id: 'apl-005a', invoiceId: 'ap-inv-005', sequence: 1, description: 'Network switches', accountId: 'acc-5010', accountCode: '5010', accountName: 'IT Equipment', quantity: 4, unitPrice: 2225, amount: 8900, taxCode: 'STD', taxRate: 0.08, taxAmount: 712 },
      ],
      journalId: 'jnl-ap-005', approvedBy: 'user-manager', approvedAt: '2024-10-20T10:00:00Z',
      rejectedBy: null, rejectedAt: null, rejectionReason: null, postedAt: '2024-10-21T09:00:00Z',
      notes: null, attachmentUrl: null,
      preparedBy: 'user-ap-clerk', createdAt: '2024-10-16T09:00:00Z', updatedAt: '2024-11-16T10:00:00Z',
    },
    {
      id: 'ap-inv-006', tenantId: 'tenant-acme', entityId: 'entity-us',
      vendorId: 'vendor-005', vendorName: 'Marketing Agency Co',
      invoiceNumber: 'MAC-2024-441', invoiceDate: '2024-12-20', dueDate: '2025-01-19',
      receivedDate: '2024-12-21', currency: 'USD',
      subtotalAmount: 35000, taxAmount: 0, totalAmount: 35000,
      paidAmount: 0, outstandingAmount: 35000,
      status: 'posted',
      lines: [
        { id: 'apl-006a', invoiceId: 'ap-inv-006', sequence: 1, description: 'Q4 marketing campaign', accountId: 'acc-5050', accountCode: '5050', accountName: 'Marketing Expenses', quantity: 1, unitPrice: 35000, amount: 35000, taxCode: null, taxRate: 0, taxAmount: 0 },
      ],
      journalId: 'jnl-ap-006', approvedBy: 'user-controller', approvedAt: '2024-12-22T11:00:00Z',
      rejectedBy: null, rejectedAt: null, rejectionReason: null, postedAt: '2024-12-22T11:30:00Z',
      notes: null, attachmentUrl: null,
      preparedBy: 'user-ap-clerk', createdAt: '2024-12-21T09:00:00Z', updatedAt: '2024-12-22T11:30:00Z',
    },
  ]
  for (const inv of invoices) _invoices.set(inv.id, inv)
  void now
})()

// ─── Services object ──────────────────────────────────────────────────────────

const services = {
  audit: AuditService,
  getPeriodStatus: async (pid: string) => PeriodEngine.getPeriodStatus(pid),
  getAccountActive: async (_id: string) => true,
}

// ─── PayIQService ─────────────────────────────────────────────────────────────

export class PayIQService {
  static async getInvoices(ctx: ServiceContext, filters: InvoiceFilters = {}): Promise<APInvoice[]> {
    let invoices = Array.from(_invoices.values()).filter(
      (i) => i.tenantId === ctx.tenantId && i.entityId === ctx.entityId,
    )
    if (filters.status) invoices = invoices.filter((i) => i.status === filters.status)
    if (filters.vendorId) invoices = invoices.filter((i) => i.vendorId === filters.vendorId)
    if (filters.fromDate) invoices = invoices.filter((i) => i.invoiceDate >= filters.fromDate!)
    if (filters.toDate) invoices = invoices.filter((i) => i.invoiceDate <= filters.toDate!)
    if (filters.search) {
      const s = filters.search.toLowerCase()
      invoices = invoices.filter(
        (i) =>
          i.invoiceNumber.toLowerCase().includes(s) ||
          i.vendorName.toLowerCase().includes(s),
      )
    }
    if (filters.overdue) {
      const today = new Date().toISOString().slice(0, 10)
      invoices = invoices.filter((i) => i.dueDate < today && i.status !== 'paid' && i.status !== 'void')
    }
    return invoices.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  static async getInvoice(ctx: ServiceContext, invoiceId: string): Promise<APInvoice> {
    const inv = _invoices.get(invoiceId)
    if (!inv || inv.tenantId !== ctx.tenantId) throw new Error(`Invoice ${invoiceId} not found`)
    return inv
  }

  static async createInvoice(
    ctx: ServiceContext,
    data: Pick<APInvoice, 'vendorId' | 'vendorName' | 'invoiceNumber' | 'invoiceDate' | 'dueDate' | 'currency' | 'lines' | 'notes'>,
  ): Promise<APInvoice> {
    const subtotal = data.lines.reduce((s, l) => s + l.amount, 0)
    const tax = data.lines.reduce((s, l) => s + l.taxAmount, 0)
    const invoice: APInvoice = {
      id: generateId(),
      tenantId: ctx.tenantId,
      entityId: ctx.entityId,
      ...data,
      receivedDate: new Date().toISOString().slice(0, 10),
      subtotalAmount: subtotal,
      taxAmount: tax,
      totalAmount: subtotal + tax,
      paidAmount: 0,
      outstandingAmount: subtotal + tax,
      status: 'draft',
      journalId: null,
      approvedBy: null, approvedAt: null,
      rejectedBy: null, rejectedAt: null, rejectionReason: null,
      postedAt: null, attachmentUrl: null,
      preparedBy: ctx.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    _invoices.set(invoice.id, invoice)
    await AuditService.log(ctx, 'invoice.created', {
      sourceModule: 'payiq', resourceType: 'ap_invoice', resourceId: invoice.id,
      description: `AP Invoice ${invoice.invoiceNumber} created — ${invoice.currency} ${invoice.totalAmount.toLocaleString()}`,
    })
    return invoice
  }

  static async submitInvoice(ctx: ServiceContext, invoiceId: string): Promise<APInvoice> {
    const inv = await this.getInvoice(ctx, invoiceId)
    if (inv.status !== 'draft' && inv.status !== 'rejected') {
      throw new Error(`Cannot submit invoice in ${inv.status} status`)
    }
    const updated = { ...inv, status: 'pending_approval' as APInvoiceStatus, updatedAt: new Date().toISOString() }
    _invoices.set(invoiceId, updated)
    await AuditService.log(ctx, 'invoice.created', {
      sourceModule: 'payiq', resourceType: 'ap_invoice', resourceId: invoiceId,
      description: `AP Invoice ${inv.invoiceNumber} submitted for approval`,
      beforeState: { status: 'draft' }, afterState: { status: 'pending_approval' },
    })
    return updated
  }

  static async approveInvoice(ctx: ServiceContext, invoiceId: string): Promise<APInvoice> {
    const inv = await this.getInvoice(ctx, invoiceId)
    if (inv.status !== 'pending_approval') throw new Error(`Cannot approve invoice in ${inv.status} status`)
    if (inv.preparedBy === ctx.userId) throw new Error('SoD violation: preparer cannot approve')
    const now = new Date().toISOString()
    const updated = { ...inv, status: 'approved' as APInvoiceStatus, approvedBy: ctx.userId, approvedAt: now, updatedAt: now }
    _invoices.set(invoiceId, updated)
    await AuditService.log(ctx, 'invoice.approved', {
      sourceModule: 'payiq', resourceType: 'ap_invoice', resourceId: invoiceId,
      description: `AP Invoice ${inv.invoiceNumber} approved`,
      beforeState: { status: 'pending_approval' }, afterState: { status: 'approved' },
    })
    return updated
  }

  static async rejectInvoice(ctx: ServiceContext, invoiceId: string, reason: string): Promise<APInvoice> {
    const inv = await this.getInvoice(ctx, invoiceId)
    if (inv.status !== 'pending_approval') throw new Error(`Cannot reject invoice in ${inv.status} status`)
    const now = new Date().toISOString()
    const updated = { ...inv, status: 'rejected' as APInvoiceStatus, rejectedBy: ctx.userId, rejectedAt: now, rejectionReason: reason, updatedAt: now }
    _invoices.set(invoiceId, updated)
    await AuditService.log(ctx, 'invoice.rejected', {
      sourceModule: 'payiq', resourceType: 'ap_invoice', resourceId: invoiceId,
      description: `AP Invoice ${inv.invoiceNumber} rejected — ${reason}`,
    })
    return updated
  }

  static async postInvoice(ctx: ServiceContext, invoiceId: string): Promise<{ invoice: APInvoice; journal: Journal }> {
    const inv = await this.getInvoice(ctx, invoiceId)
    if (inv.status !== 'approved') throw new Error(`Cannot post invoice in ${inv.status} status`)

    const period = await PeriodService.getCurrentOpenPeriod(ctx.tenantId, ctx.entityId)
    if (!period) throw new Error('No open period found')
    await PeriodService.checkPeriodLock(period.id)

    const journalLines: JournalLine[] = [
      // Debit each expense line
      ...inv.lines.map((line, idx) => ({
        id: generateId(), journalId: '', sequence: idx + 1,
        accountId: line.accountId, accountCode: line.accountCode, accountName: line.accountName,
        description: `${inv.invoiceNumber} — ${line.description}`,
        debit: line.amount + line.taxAmount, credit: 0,
        currency: inv.currency, fxRate: 1,
        functionalDebit: line.amount + line.taxAmount, functionalCredit: 0,
        entityId: ctx.entityId,
      })),
      // Credit AP control account
      {
        id: generateId(), journalId: '', sequence: inv.lines.length + 1,
        accountId: 'acc-2010', accountCode: '2010', accountName: 'Accounts Payable',
        description: `AP — ${inv.vendorName} — ${inv.invoiceNumber}`,
        debit: 0, credit: inv.totalAmount,
        currency: inv.currency, fxRate: 1,
        functionalDebit: 0, functionalCredit: inv.totalAmount,
        entityId: ctx.entityId,
      },
    ]

    const journal = ApprovalEngine.createJournal({
      tenantId: ctx.tenantId, entityId: ctx.entityId, periodId: period.id,
      reference: `AP-${inv.invoiceNumber}`, description: `AP Invoice — ${inv.vendorName} — ${inv.invoiceNumber}`,
      preparedBy: ctx.userId, sourceModule: 'payiq', sourceId: invoiceId,
      totalDebit: inv.totalAmount, totalCredit: inv.totalAmount,
      lines: journalLines,
    })
    journal.lines.forEach((l) => { l.journalId = journal.id })

    const postResult = await LedgerEngine.postJournal({ ...journal, status: 'approved', postedBy: ctx.userId }, services)
    if (!postResult.success) throw new Error(postResult.errors.join('; '))

    const now = new Date().toISOString()
    const updatedInvoice = { ...inv, status: 'posted' as APInvoiceStatus, journalId: journal.id, postedAt: now, updatedAt: now }
    _invoices.set(invoiceId, updatedInvoice)

    await AuditService.log(ctx, 'invoice.posted', {
      sourceModule: 'payiq', resourceType: 'ap_invoice', resourceId: invoiceId,
      description: `AP Invoice ${inv.invoiceNumber} posted — journal ${journal.reference}`,
      afterState: { journalId: journal.id, postedAt: now },
    })

    return { invoice: updatedInvoice, journal }
  }

  static async voidInvoice(ctx: ServiceContext, invoiceId: string, reason: string): Promise<APInvoice> {
    const inv = await this.getInvoice(ctx, invoiceId)
    if (inv.status === 'paid') throw new Error('Cannot void a paid invoice')
    const updated = { ...inv, status: 'void' as APInvoiceStatus, notes: `VOID: ${reason}`, updatedAt: new Date().toISOString() }
    _invoices.set(invoiceId, updated)
    await AuditService.log(ctx, 'invoice.voided', {
      sourceModule: 'payiq', resourceType: 'ap_invoice', resourceId: invoiceId,
      description: `AP Invoice ${inv.invoiceNumber} voided — ${reason}`,
    })
    return updated
  }

  static async getPayments(ctx: ServiceContext): Promise<APPayment[]> {
    return Array.from(_payments.values()).filter(
      (p) => p.tenantId === ctx.tenantId && p.entityId === ctx.entityId,
    )
  }
}
