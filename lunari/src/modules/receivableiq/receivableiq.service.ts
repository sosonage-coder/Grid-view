import type { ServiceContext } from '../../platform/types/core'
import { AuditService } from '../../platform/services/audit.service'
import { generateId } from '../../engine/ledger.engine'
import type { ARInvoice, ARReceipt, AgingReport, ARFilters, ARInvoiceStatus } from './types'

const _invoices: Map<string, ARInvoice> = new Map()
const _receipts: Map<string, ARReceipt> = new Map()

;(function seed() {
  const invoices: ARInvoice[] = [
    {
      id: 'ar-inv-001', tenantId: 'tenant-acme', entityId: 'entity-us',
      customerId: 'cust-001', customerName: 'Globex Industries',
      invoiceNumber: 'INV-2024-0441', invoiceDate: '2024-12-01', dueDate: '2024-12-31',
      currency: 'USD', subtotalAmount: 75000, taxAmount: 0, totalAmount: 75000,
      paidAmount: 0, outstandingAmount: 75000, status: 'overdue',
      lines: [{ id: 'arl-001a', invoiceId: 'ar-inv-001', sequence: 1, description: 'Software licenses Q4', accountId: 'acc-4010', accountCode: '4010', accountName: 'Software Revenue', quantity: 50, unitPrice: 1500, amount: 75000, taxCode: null, taxRate: 0, taxAmount: 0 }],
      journalId: 'jnl-ar-001', sentAt: '2024-12-02T09:00:00Z', approvedBy: 'user-manager', approvedAt: '2024-12-03T10:00:00Z', postedAt: '2024-12-03T10:30:00Z',
      notes: null, preparedBy: 'user-ar-clerk', createdAt: '2024-12-01T09:00:00Z', updatedAt: '2025-01-02T00:00:00Z',
    },
    {
      id: 'ar-inv-002', tenantId: 'tenant-acme', entityId: 'entity-us',
      customerId: 'cust-002', customerName: 'Springfield Corp',
      invoiceNumber: 'INV-2024-0442', invoiceDate: '2024-12-15', dueDate: '2025-01-14',
      currency: 'USD', subtotalAmount: 32000, taxAmount: 0, totalAmount: 32000,
      paidAmount: 0, outstandingAmount: 32000, status: 'posted',
      lines: [{ id: 'arl-002a', invoiceId: 'ar-inv-002', sequence: 1, description: 'Consulting services Dec', accountId: 'acc-4020', accountCode: '4020', accountName: 'Consulting Revenue', quantity: 1, unitPrice: 32000, amount: 32000, taxCode: null, taxRate: 0, taxAmount: 0 }],
      journalId: 'jnl-ar-002', sentAt: '2024-12-15T14:00:00Z', approvedBy: 'user-manager', approvedAt: '2024-12-16T09:00:00Z', postedAt: '2024-12-16T09:30:00Z',
      notes: null, preparedBy: 'user-ar-clerk', createdAt: '2024-12-15T09:00:00Z', updatedAt: '2024-12-16T09:30:00Z',
    },
    {
      id: 'ar-inv-003', tenantId: 'tenant-acme', entityId: 'entity-us',
      customerId: 'cust-003', customerName: 'Initech Solutions',
      invoiceNumber: 'INV-2024-0440', invoiceDate: '2024-11-15', dueDate: '2024-12-15',
      currency: 'USD', subtotalAmount: 18500, taxAmount: 0, totalAmount: 18500,
      paidAmount: 18500, outstandingAmount: 0, status: 'paid',
      lines: [{ id: 'arl-003a', invoiceId: 'ar-inv-003', sequence: 1, description: 'Support services Nov', accountId: 'acc-4030', accountCode: '4030', accountName: 'Support Revenue', quantity: 1, unitPrice: 18500, amount: 18500, taxCode: null, taxRate: 0, taxAmount: 0 }],
      journalId: 'jnl-ar-003', sentAt: '2024-11-15T09:00:00Z', approvedBy: 'user-manager', approvedAt: '2024-11-16T09:00:00Z', postedAt: '2024-11-16T09:30:00Z',
      notes: null, preparedBy: 'user-ar-clerk', createdAt: '2024-11-15T09:00:00Z', updatedAt: '2024-12-18T10:00:00Z',
    },
    {
      id: 'ar-inv-004', tenantId: 'tenant-acme', entityId: 'entity-us',
      customerId: 'cust-001', customerName: 'Globex Industries',
      invoiceNumber: 'INV-2024-0420', invoiceDate: '2024-09-01', dueDate: '2024-10-01',
      currency: 'USD', subtotalAmount: 45000, taxAmount: 0, totalAmount: 45000,
      paidAmount: 0, outstandingAmount: 45000, status: 'overdue',
      lines: [{ id: 'arl-004a', invoiceId: 'ar-inv-004', sequence: 1, description: 'Software licenses Q3', accountId: 'acc-4010', accountCode: '4010', accountName: 'Software Revenue', quantity: 30, unitPrice: 1500, amount: 45000, taxCode: null, taxRate: 0, taxAmount: 0 }],
      journalId: 'jnl-ar-004', sentAt: '2024-09-01T09:00:00Z', approvedBy: 'user-manager', approvedAt: '2024-09-02T09:00:00Z', postedAt: '2024-09-02T09:30:00Z',
      notes: '90+ days overdue — collections engaged', preparedBy: 'user-ar-clerk', createdAt: '2024-09-01T09:00:00Z', updatedAt: '2025-01-02T00:00:00Z',
    },
    {
      id: 'ar-inv-005', tenantId: 'tenant-acme', entityId: 'entity-us',
      customerId: 'cust-004', customerName: 'Umbrella Ventures',
      invoiceNumber: 'INV-2025-0001', invoiceDate: '2025-01-05', dueDate: '2025-02-04',
      currency: 'USD', subtotalAmount: 120000, taxAmount: 0, totalAmount: 120000,
      paidAmount: 0, outstandingAmount: 120000, status: 'draft',
      lines: [{ id: 'arl-005a', invoiceId: 'ar-inv-005', sequence: 1, description: 'Annual subscription 2025', accountId: 'acc-4010', accountCode: '4010', accountName: 'Software Revenue', quantity: 1, unitPrice: 120000, amount: 120000, taxCode: null, taxRate: 0, taxAmount: 0 }],
      journalId: null, sentAt: null, approvedBy: null, approvedAt: null, postedAt: null,
      notes: null, preparedBy: 'user-ar-clerk', createdAt: '2025-01-05T09:00:00Z', updatedAt: '2025-01-05T09:00:00Z',
    },
  ]
  for (const inv of invoices) _invoices.set(inv.id, inv)
})()

export class ReceivableIQService {
  static async getInvoices(ctx: ServiceContext, filters: ARFilters = {}): Promise<ARInvoice[]> {
    let invoices = Array.from(_invoices.values()).filter(
      (i) => i.tenantId === ctx.tenantId && i.entityId === ctx.entityId,
    )
    if (filters.status) invoices = invoices.filter((i) => i.status === filters.status)
    if (filters.customerId) invoices = invoices.filter((i) => i.customerId === filters.customerId)
    if (filters.search) {
      const s = filters.search.toLowerCase()
      invoices = invoices.filter((i) => i.invoiceNumber.toLowerCase().includes(s) || i.customerName.toLowerCase().includes(s))
    }
    if (filters.overdue) {
      const today = new Date().toISOString().slice(0, 10)
      invoices = invoices.filter((i) => i.dueDate < today && !['paid', 'void', 'written_off'].includes(i.status))
    }
    return invoices.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  static async approveInvoice(ctx: ServiceContext, invoiceId: string): Promise<ARInvoice> {
    const inv = _invoices.get(invoiceId)
    if (!inv) throw new Error('Invoice not found')
    const now = new Date().toISOString()
    const updated = { ...inv, status: 'approved' as ARInvoiceStatus, approvedBy: ctx.userId, approvedAt: now, updatedAt: now }
    _invoices.set(invoiceId, updated)
    await AuditService.log(ctx, 'invoice.approved', { sourceModule: 'receivableiq', resourceType: 'ar_invoice', resourceId: invoiceId, description: `AR Invoice ${inv.invoiceNumber} approved` })
    return updated
  }

  static async getAgingReport(ctx: ServiceContext): Promise<AgingReport[]> {
    const today = new Date()
    const invoices = await this.getInvoices(ctx, {})
    const outstanding = invoices.filter((i) => !['paid', 'void', 'written_off', 'draft'].includes(i.status) && i.outstandingAmount > 0)

    const byCustomer = new Map<string, ARInvoice[]>()
    for (const inv of outstanding) {
      const arr = byCustomer.get(inv.customerId) ?? []
      arr.push(inv)
      byCustomer.set(inv.customerId, arr)
    }

    const report: AgingReport[] = []
    for (const [customerId, cinvoices] of byCustomer) {
      const customerName = cinvoices[0].customerName
      let current = 0, days1to30 = 0, days31to60 = 0, days61to90 = 0, over90 = 0
      for (const inv of cinvoices) {
        const due = new Date(inv.dueDate)
        const days = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
        if (days <= 0) current += inv.outstandingAmount
        else if (days <= 30) days1to30 += inv.outstandingAmount
        else if (days <= 60) days31to60 += inv.outstandingAmount
        else if (days <= 90) days61to90 += inv.outstandingAmount
        else over90 += inv.outstandingAmount
      }
      report.push({ customerId, customerName, currency: cinvoices[0].currency, current, days1to30, days31to60, days61to90, over90, total: current + days1to30 + days31to60 + days61to90 + over90, invoices: cinvoices })
    }
    return report.sort((a, b) => b.total - a.total)
  }

  static async getReceipts(ctx: ServiceContext): Promise<ARReceipt[]> {
    return Array.from(_receipts.values()).filter((r) => r.tenantId === ctx.tenantId && r.entityId === ctx.entityId)
  }

  static async createReceipt(ctx: ServiceContext, data: Pick<ARReceipt, 'customerId' | 'customerName' | 'invoiceIds' | 'receiptDate' | 'amount' | 'currency' | 'bankAccountId' | 'reference'>): Promise<ARReceipt> {
    const receipt: ARReceipt = { ...data, id: generateId(), tenantId: ctx.tenantId, entityId: ctx.entityId, status: 'draft', journalId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    _receipts.set(receipt.id, receipt)
    return receipt
  }
}
