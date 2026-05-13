// ─── AP Invoice ───────────────────────────────────────────────────────────────

export type APInvoiceStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'posted'
  | 'paid'
  | 'partially_paid'
  | 'void'
  | 'rejected'

export interface APInvoiceLine {
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
  taxRate: number // 0-1 e.g. 0.1 = 10%
  taxAmount: number
}

export interface APInvoice {
  id: string
  tenantId: string
  entityId: string
  vendorId: string
  vendorName: string
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  receivedDate: string
  currency: string
  subtotalAmount: number
  taxAmount: number
  totalAmount: number
  paidAmount: number
  outstandingAmount: number
  status: APInvoiceStatus
  lines: APInvoiceLine[]
  journalId: string | null
  approvedBy: string | null
  approvedAt: string | null
  rejectedBy: string | null
  rejectedAt: string | null
  rejectionReason: string | null
  postedAt: string | null
  notes: string | null
  attachmentUrl: string | null
  preparedBy: string
  createdAt: string
  updatedAt: string
}

// ─── AP Payment ───────────────────────────────────────────────────────────────

export type APPaymentStatus = 'draft' | 'pending_approval' | 'approved' | 'processed' | 'cancelled'

export interface APPayment {
  id: string
  tenantId: string
  entityId: string
  vendorId: string
  vendorName: string
  invoiceIds: string[]
  paymentDate: string
  amount: number
  currency: string
  bankAccountId: string
  bankAccountName: string
  reference: string
  memo: string | null
  status: APPaymentStatus
  journalId: string | null
  processedAt: string | null
  createdAt: string
  updatedAt: string
}

// ─── Payment Run ──────────────────────────────────────────────────────────────

export interface PaymentRunItem {
  invoiceId: string
  invoiceNumber: string
  vendorId: string
  vendorName: string
  amount: number
  currency: string
  dueDate: string
  selected: boolean
}

export interface PaymentRun {
  id: string
  tenantId: string
  entityId: string
  runDate: string
  bankAccountId: string
  items: PaymentRunItem[]
  totalAmount: number
  currency: string
  status: 'draft' | 'approved' | 'processed'
  createdBy: string
  createdAt: string
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface InvoiceFilters {
  status?: APInvoiceStatus
  vendorId?: string
  fromDate?: string
  toDate?: string
  search?: string
  overdue?: boolean
}
