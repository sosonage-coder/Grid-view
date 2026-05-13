import { Badge } from './Badge'
import type { APInvoiceStatus } from '../../modules/payiq/types'
import type { ARInvoiceStatus } from '../../modules/receivableiq/types'
import type { JournalStatus } from '../../platform/types/ledger'
import type { PeriodStatus } from '../../platform/types/core'

// ─── AP Invoice Status ────────────────────────────────────────────────────────

export function APStatusChip({ status }: { status: APInvoiceStatus }) {
  const map: Record<APInvoiceStatus, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted' }> = {
    draft: { label: 'Draft', variant: 'muted' },
    pending_approval: { label: 'Pending Approval', variant: 'warning' },
    approved: { label: 'Approved', variant: 'info' },
    posted: { label: 'Posted', variant: 'primary' },
    paid: { label: 'Paid', variant: 'success' },
    partially_paid: { label: 'Partial', variant: 'warning' },
    void: { label: 'Void', variant: 'danger' },
    rejected: { label: 'Rejected', variant: 'danger' },
  }
  const { label, variant } = map[status]
  return <Badge variant={variant} dot>{label}</Badge>
}

// ─── AR Invoice Status ────────────────────────────────────────────────────────

export function ARStatusChip({ status }: { status: ARInvoiceStatus }) {
  const map: Record<ARInvoiceStatus, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted' }> = {
    draft: { label: 'Draft', variant: 'muted' },
    sent: { label: 'Sent', variant: 'info' },
    pending_approval: { label: 'Pending', variant: 'warning' },
    approved: { label: 'Approved', variant: 'info' },
    posted: { label: 'Posted', variant: 'primary' },
    paid: { label: 'Paid', variant: 'success' },
    partially_paid: { label: 'Partial', variant: 'warning' },
    overdue: { label: 'Overdue', variant: 'danger' },
    void: { label: 'Void', variant: 'muted' },
    written_off: { label: 'Written Off', variant: 'danger' },
  }
  const { label, variant } = map[status]
  return <Badge variant={variant} dot>{label}</Badge>
}

// ─── Journal Status ───────────────────────────────────────────────────────────

export function JournalStatusChip({ status }: { status: JournalStatus }) {
  const map: Record<JournalStatus, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted' }> = {
    draft: { label: 'Draft', variant: 'muted' },
    pending_approval: { label: 'Pending', variant: 'warning' },
    approved: { label: 'Approved', variant: 'info' },
    posted: { label: 'Posted', variant: 'success' },
    reversed: { label: 'Reversed', variant: 'danger' },
    rejected: { label: 'Rejected', variant: 'danger' },
  }
  const { label, variant } = map[status]
  return <Badge variant={variant} dot>{label}</Badge>
}

// ─── Period Status ────────────────────────────────────────────────────────────

export function PeriodStatusChip({ status }: { status: PeriodStatus }) {
  const map: Record<PeriodStatus, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted' }> = {
    open: { label: 'Open', variant: 'success' },
    closed: { label: 'Closed', variant: 'warning' },
    locked: { label: 'Locked', variant: 'danger' },
  }
  const { label, variant } = map[status]
  return <Badge variant={variant} dot>{label}</Badge>
}
