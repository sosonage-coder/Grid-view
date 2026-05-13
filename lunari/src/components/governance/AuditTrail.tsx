import { useEffect, useState } from 'react'
import { Clock, User, Shield } from 'lucide-react'
import { AuditService } from '../../platform/services/audit.service'
import { AuthService } from '../../platform/services/auth.service'
import type { AuditEvent } from '../../platform/types/audit'

interface AuditTrailProps {
  resourceId: string
  resourceType: string
  limit?: number
}

export function AuditTrail({ resourceId, resourceType, limit = 20 }: AuditTrailProps) {
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const ctx = AuthService.getServiceContext()

  useEffect(() => {
    setLoading(true)
    AuditService.getAuditLog(ctx, { resourceId, resourceType }, 1, limit)
      .then((log) => setEvents(log.events))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceId, resourceType])

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 bg-slate-700 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <p className="text-sm text-slate-500 text-center py-4">No audit events yet</p>
    )
  }

  return (
    <div className="space-y-1">
      {events.map((event, idx) => (
        <div key={event.id} className="flex items-start gap-3 py-2 text-xs">
          <div className="flex flex-col items-center">
            <div className="h-6 w-6 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
              <Shield className="h-3 w-3 text-slate-400" />
            </div>
            {idx < events.length - 1 && (
              <div className="w-px flex-1 min-h-4 bg-slate-700 mt-1" />
            )}
          </div>
          <div className="flex-1 min-w-0 pb-2">
            <p className="text-slate-300 font-medium">{event.description}</p>
            <div className="flex items-center gap-3 mt-0.5 text-slate-500">
              <span className="flex items-center gap-1">
                <User className="h-2.5 w-2.5" />
                {event.userName}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" />
                {new Date(event.createdAt).toLocaleString()}
              </span>
              <span className="font-mono text-slate-600">{event.eventType}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
