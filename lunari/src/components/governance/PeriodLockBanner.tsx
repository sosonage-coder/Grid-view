import { Lock } from 'lucide-react'
import type { AccountingPeriod } from '../../platform/types/core'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface PeriodLockBannerProps {
  period: AccountingPeriod | null
}

export function PeriodLockBanner({ period }: PeriodLockBannerProps) {
  if (!period || period.status === 'open') return null

  const label = `${MONTHS[period.month - 1]} ${period.year}`

  if (period.status === 'locked') {
    return (
      <div className="flex items-center gap-3 bg-red-950/50 border border-red-800/60 rounded-lg px-4 py-3 mb-4">
        <Lock className="h-4 w-4 text-red-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-300">
            Period {label} is locked
          </p>
          <p className="text-xs text-red-400/80 mt-0.5">
            Posting is not permitted. Contact your Finance Controller to unlock.
            {period.lockedBy && ` Locked by ${period.lockedBy} on ${period.lockedAt ? new Date(period.lockedAt).toLocaleDateString() : '—'}.`}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 bg-amber-950/50 border border-amber-800/60 rounded-lg px-4 py-3 mb-4">
      <Lock className="h-4 w-4 text-amber-400 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-amber-300">
          Period {label} is closed
        </p>
        <p className="text-xs text-amber-400/80 mt-0.5">
          This period has been closed. Reopen it before posting new transactions.
        </p>
      </div>
    </div>
  )
}
