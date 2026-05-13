import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react'
import { useState } from 'react'
import type { AnomalyFlag } from '../types'
import clsx from 'clsx'

interface AIAnomalyAlertProps {
  flags: AnomalyFlag[]
  onDismiss?: (flagId: string) => void
}

export function AIAnomalyAlert({ flags, onDismiss }: AIAnomalyAlertProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visible = flags.filter((f) => !dismissed.has(f.id))
  if (visible.length === 0) return null

  const dismiss = (id: string) => {
    setDismissed((prev) => new Set([...prev, id]))
    onDismiss?.(id)
  }

  return (
    <div className="space-y-2">
      {visible.map((flag) => (
        <div
          key={flag.id}
          className={clsx(
            'flex items-start gap-3 rounded-lg px-3 py-2.5 text-xs',
            flag.severity === 'critical' && 'bg-red-950/50 border border-red-800/50',
            flag.severity === 'warning' && 'bg-amber-950/50 border border-amber-800/50',
            flag.severity === 'info' && 'bg-blue-950/50 border border-blue-800/50',
          )}
        >
          {flag.severity === 'critical' ? (
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
          ) : flag.severity === 'warning' ? (
            <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
          ) : (
            <Info className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className={clsx(
              'font-medium',
              flag.severity === 'critical' && 'text-red-300',
              flag.severity === 'warning' && 'text-amber-300',
              flag.severity === 'info' && 'text-blue-300',
            )}>
              {flag.description}
            </p>
            <p className="text-slate-400 mt-0.5">{flag.recommendation}</p>
          </div>
          <button
            className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
            onClick={() => dismiss(flag.id)}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
