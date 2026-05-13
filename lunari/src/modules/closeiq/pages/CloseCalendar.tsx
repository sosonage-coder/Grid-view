import { useClose } from '../hooks/useClose'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import clsx from 'clsx'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function CloseCalendar() {
  const { calendar, loading } = useClose('period-2025-01')

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-100">Close Calendar</h1>
      <p className="text-sm text-slate-400">Historical and upcoming period close schedule</p>

      {loading ? (
        <div className="grid grid-cols-3 lg:grid-cols-4 gap-3">{[...Array(12)].map((_, i) => <div key={i} className="h-24 bg-slate-800 rounded-lg animate-pulse" />)}</div>
      ) : (
        <div className="grid grid-cols-3 lg:grid-cols-4 gap-3">
          {calendar.map((entry) => (
            <Card key={entry.periodId} className={clsx(
              'relative',
              entry.status === 'open' && 'border-blue-600/60',
              entry.status === 'closed' && 'border-amber-700/40',
              entry.status === 'locked' && 'border-slate-700/40 opacity-70',
            )}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-mono font-bold text-slate-200">{MONTHS[entry.month - 1]}</p>
                  <p className="text-xs text-slate-500">{entry.year}</p>
                </div>
                <Badge
                  variant={entry.status === 'open' ? 'success' : entry.status === 'closed' ? 'warning' : 'muted'}
                  size="sm"
                >
                  {entry.status}
                </Badge>
              </div>
              {entry.taskCount > 0 && (
                <div>
                  <div className="h-1 bg-slate-700 rounded-full mb-1">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${(entry.completedCount / entry.taskCount) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">{entry.completedCount}/{entry.taskCount} tasks</p>
                </div>
              )}
              {entry.actualCloseDate && (
                <p className="text-xs text-green-400 mt-1">Closed {entry.actualCloseDate}</p>
              )}
              {entry.status === 'open' && (
                <p className="text-xs text-blue-400 mt-1">Target: {entry.targetCloseDate}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
