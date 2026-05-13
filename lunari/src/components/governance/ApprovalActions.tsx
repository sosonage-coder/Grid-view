import { useState } from 'react'
import { CheckCircle, XCircle, Send, RotateCcw } from 'lucide-react'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

interface ApprovalActionsProps {
  status: string
  preparedBy: string
  currentUserId: string
  onApprove?: () => Promise<void>
  onReject?: (reason: string) => Promise<void>
  onSubmit?: () => Promise<void>
  onPost?: () => Promise<void>
  isLocked?: boolean
  loading?: boolean
}

export function ApprovalActions({
  status,
  preparedBy,
  currentUserId,
  onApprove,
  onReject,
  onSubmit,
  onPost,
  isLocked = false,
  loading = false,
}: ApprovalActionsProps) {
  const [rejecting, setRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const isSelf = preparedBy === currentUserId

  const handleAction = async (action: string, fn?: () => Promise<void>) => {
    if (!fn) return
    setActionLoading(action)
    try {
      await fn()
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async () => {
    if (!onReject || !rejectReason.trim()) return
    setActionLoading('reject')
    try {
      await onReject(rejectReason)
      setRejecting(false)
      setRejectReason('')
    } finally {
      setActionLoading(null)
    }
  }

  if (isLocked) {
    return (
      <span className="text-xs text-slate-500 italic">Period locked — no actions available</span>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {status === 'draft' && onSubmit && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Send className="h-3.5 w-3.5" />}
            loading={actionLoading === 'submit' || loading}
            onClick={() => handleAction('submit', onSubmit)}
          >
            Submit for Approval
          </Button>
        )}

        {status === 'pending_approval' && !isSelf && onApprove && (
          <Button
            variant="success"
            size="sm"
            leftIcon={<CheckCircle className="h-3.5 w-3.5" />}
            loading={actionLoading === 'approve' || loading}
            onClick={() => handleAction('approve', onApprove)}
          >
            Approve
          </Button>
        )}

        {status === 'pending_approval' && !isSelf && onReject && (
          <Button
            variant="danger"
            size="sm"
            leftIcon={<XCircle className="h-3.5 w-3.5" />}
            loading={actionLoading === 'reject' || loading}
            onClick={() => setRejecting(true)}
          >
            Reject
          </Button>
        )}

        {status === 'approved' && onPost && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
            loading={actionLoading === 'post' || loading}
            onClick={() => handleAction('post', onPost)}
          >
            Post to GL
          </Button>
        )}

        {status === 'rejected' && onSubmit && (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Send className="h-3.5 w-3.5" />}
            loading={actionLoading === 'resubmit' || loading}
            onClick={() => handleAction('resubmit', onSubmit)}
          >
            Resubmit
          </Button>
        )}

        {status === 'pending_approval' && isSelf && (
          <span className="text-xs text-amber-400">SoD: You cannot approve your own submission</span>
        )}
      </div>

      <Modal
        isOpen={rejecting}
        onClose={() => { setRejecting(false); setRejectReason('') }}
        title="Reject — Provide Reason"
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => { setRejecting(false); setRejectReason('') }}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={!rejectReason.trim()}
              loading={actionLoading === 'reject'}
              onClick={handleReject}
            >
              Confirm Rejection
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-400">
            Please provide a reason for rejection. This will be visible to the preparer.
          </p>
          <textarea
            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 resize-none"
            rows={4}
            placeholder="Enter rejection reason..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            autoFocus
          />
        </div>
      </Modal>
    </>
  )
}
