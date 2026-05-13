import { Lock, Unlock, Calendar } from 'lucide-react'
import clsx from 'clsx'
import type { AccountingPeriod } from '../../platform/types/core'

interface PeriodBadgeProps {
  period: AccountingPeriod | null
  className?: string
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function PeriodBadge({ period, className }: PeriodBadgeProps) {
  if (!period) {
    return (
      <span className={clsx('inline-flex items-center gap-1.5 text-xs text-slate-500', className)}>
        <Calendar className="h-3.5 w-3.5" />
        No period
      </span>
    )
  }

  const label = `${MONTHS[period.month - 1]} ${period.year}`

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 text-xs font-medium rounded px-2 py-1',
        period.status === 'open' && 'bg-green-900/50 text-green-300',
        period.status === 'closed' && 'bg-amber-900/50 text-amber-300',
        period.status === 'locked' && 'bg-red-900/50 text-red-300',
        className,
      )}
    >
      {period.status === 'locked' ? (
        <Lock className="h-3 w-3" />
      ) : period.status === 'closed' ? (
        <Unlock className="h-3 w-3" />
      ) : (
        <Calendar className="h-3 w-3" />
      )}
      {label}
      <span className="opacity-70">·</span>
      <span className="capitalize">{period.status}</span>
    </span>
  )
}
