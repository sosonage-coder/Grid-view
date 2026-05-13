export type ARInvoiceStatus =
  | 'draft'
  | 'sent'
  | 'pending_approval'
  | 'approved'
  | 'posted'
  | 'paid'
  | 'partially_paid'
  | 'overdue'
  | 'void'
  | 'written_off'

export interface ARInvoiceLine {
  id: string
  invoiceId: string
  sequence: number
  description: string
  accountId: string
  accountCode: string
  accountName: string
  quantity: number
  unitPrice: number
  amount: number
  taxCode: string | null
  taxRate: number
  taxAmount: number
}

export interface ARInvoice {
  id: string
  tenantId: string
  entityId: string
  customerId: string
  customerName: string
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  currency: string
  subtotalAmount: number
  taxAmount: number
  totalAmount: number
  paidAmount: number
  outstandingAmount: number
  status: ARInvoiceStatus
  lines: ARInvoiceLine[]
  journalId: string | null
  sentAt: string | null
  approvedBy: string | null
  approvedAt: string | null
  postedAt: string | null
  notes: string | null
  preparedBy: string
  createdAt: string
  updatedAt: string
}

export interface ARReceipt {
  id: string
  tenantId: string
  entityId: string
  customerId: string
  customerName: string
  invoiceIds: string[]
  receiptDate: string
  amount: number
  currency: string
  bankAccountId: string
  reference: string
  status: 'draft' | 'posted' | 'matched'
  journalId: string | null
  createdAt: string
  updatedAt: string
}

export interface AgingBucket {
  label: string
  fromDays: number
  toDays: number | null
  amount: number
  invoiceCount: number
}

export interface AgingReport {
  customerId: string
  customerName: string
  currency: string
  current: number
  days1to30: number
  days31to60: number
  days61to90: number
  over90: number
  total: number
  invoices: ARInvoice[]
}

export interface ARFilters {
  status?: ARInvoiceStatus
  customerId?: string
  fromDate?: string
  toDate?: string
  search?: string
  overdue?: boolean
}
