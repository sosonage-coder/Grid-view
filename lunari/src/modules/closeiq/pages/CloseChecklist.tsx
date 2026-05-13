import { useClose } from '../hooks/useClose'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card'
import { CheckCircle, Circle, Clock, AlertTriangle, XCircle } from 'lucide-react'
import { useCurrentUser } from '../../../platform/hooks/useCurrentUser'
import clsx from 'clsx'
import type { CloseTask, CloseTaskStatus } from '../types'

const STATUS_ICONS: Record<CloseTaskStatus, React.ReactNode> = {
  not_started: <Circle className="h-4 w-4 text-slate-600" />,
  in_progress: <Clock className="h-4 w-4 text-amber-400" />,
  completed: <CheckCircle className="h-4 w-4 text-green-400" />,
  blocked: <XCircle className="h-4 w-4 text-red-400" />,
  waived: <AlertTriangle className="h-4 w-4 text-slate-500" />,
}

const PRIORITY_BADGE: Record<CloseTask['priority'], 'danger' | 'warning' | 'info' | 'muted'> = {
  critical: 'danger', high: 'warning', medium: 'info', low: 'muted',
}

export function CloseChecklist() {
  const { checklist, loading, completeTask } = useClose('period-2025-01')
  const { can } = useCurrentUser()

  if (loading) return <div className="text-slate-500 text-sm">Loading close checklist...</div>
  if (!checklist) return <div className="text-slate-500 text-sm">No checklist for this period</div>

  const byCategory = checklist.tasks.reduce<Record<string, CloseTask[]>>((acc, t) => {
    if (!acc[t.category]) acc[t.category] = []
    acc[t.category].push(t)
    return acc
  }, {})

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Close Checklist — {checklist.periodLabel}</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {checklist.completedTasks}/{checklist.totalTasks} tasks complete · {checklist.completionPct}%
            {checklist.blockedTasks > 0 && <span className="text-red-400 ml-2">· {checklist.blockedTasks} blocked</span>}
          </p>
        </div>
        <Badge variant={checklist.completionPct === 100 ? 'success' : checklist.completionPct > 50 ? 'info' : 'warning'}>
          {checklist.status.replace('_', ' ')}
        </Badge>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${checklist.completionPct}%` }} />
      </div>

      {/* Tasks by category */}
      <div className="space-y-4">
        {Object.entries(byCategory).map(([category, tasks]) => (
          <Card key={category} padding="none">
            <CardHeader className="px-4 py-3">
              <CardTitle className="capitalize">{category.replace('_', ' ')}</CardTitle>
              <span className="text-xs text-slate-500">{tasks.filter((t) => t.status === 'completed').length}/{tasks.length}</span>
            </CardHeader>
            <div className="divide-y divide-slate-700/50">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={clsx(
                    'flex items-start gap-3 px-4 py-3',
                    task.status === 'completed' && 'opacity-60',
                  )}
                >
                  <div className="mt-0.5 flex-shrink-0">{STATUS_ICONS[task.status]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={clsx('text-sm font-medium', task.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-200')}>
                        {task.name}
                      </p>
                      <Badge variant={PRIORITY_BADGE[task.priority]} size="sm">{task.priority}</Badge>
                      {task.dependency.length > 0 && <Badge variant="muted" size="sm">deps: {task.dependency.length}</Badge>}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span>Due: <span className="font-mono">{task.dueDate} {task.dueTime}</span></span>
                      <span>Owner: {task.ownerName}</span>
                    </div>
                    {task.blockedReason && <p className="text-xs text-red-400 mt-1">Blocked: {task.blockedReason}</p>}
                  </div>
                  {task.status !== 'completed' && task.status !== 'waived' && can('close:manage') && (
                    <Button
                      size="xs"
                      variant={task.status === 'blocked' ? 'danger' : 'secondary'}
                      disabled={task.status === 'blocked'}
                      onClick={() => completeTask(task.id).catch(() => {})}
                    >
                      Complete
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
