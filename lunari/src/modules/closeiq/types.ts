export type CloseTaskStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'waived'
export type CloseTaskCategory =
  | 'reconciliation'
  | 'journal_entry'
  | 'approval'
  | 'reporting'
  | 'compliance'
  | 'data_validation'
  | 'sign_off'

export interface CloseTask {
  id: string
  tenantId: string
  entityId: string
  periodId: string
  name: string
  description: string
  category: CloseTaskCategory
  ownerId: string
  ownerName: string
  reviewerId: string | null
  reviewerName: string | null
  dueDate: string
  dueTime: string // HH:MM
  completedAt: string | null
  completedBy: string | null
  status: CloseTaskStatus
  blockedReason: string | null
  waivedReason: string | null
  dependency: string[] // task IDs that must be complete first
  priority: 'critical' | 'high' | 'medium' | 'low'
  sequence: number
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface CloseChecklist {
  id: string
  tenantId: string
  entityId: string
  periodId: string
  periodLabel: string
  tasks: CloseTask[]
  totalTasks: number
  completedTasks: number
  blockedTasks: number
  completionPct: number
  estimatedCloseDate: string | null
  actualCloseDate: string | null
  status: 'open' | 'in_progress' | 'closed' | 'locked'
  createdAt: string
  updatedAt: string
}

export interface CloseCalendarEntry {
  periodId: string
  periodLabel: string
  year: number
  month: number
  status: 'open' | 'closed' | 'locked'
  taskCount: number
  completedCount: number
  targetCloseDate: string
  actualCloseDate: string | null
  daysToClose: number | null
}
