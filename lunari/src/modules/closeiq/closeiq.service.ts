import type { ServiceContext } from '../../platform/types/core'
import { AuditService } from '../../platform/services/audit.service'
import { generateId } from '../../engine/ledger.engine'
import { PeriodEngine } from '../../engine/period.engine'
import type { CloseTask, CloseChecklist, CloseTaskStatus, CloseCalendarEntry } from './types'

const _tasks: Map<string, CloseTask> = new Map()
const _checklists: Map<string, CloseChecklist> = new Map()

;(function seed() {
  const tasks: CloseTask[] = [
    { id: 'ct-001', tenantId: 'tenant-acme', entityId: 'entity-us', periodId: 'period-2025-01', name: 'Post all AP invoices', description: 'Ensure all received AP invoices for the period are posted to GL', category: 'journal_entry', ownerId: 'user-ap-clerk', ownerName: 'David Kim', reviewerId: 'user-manager', reviewerName: 'James Wilson', dueDate: '2025-01-15', dueTime: '17:00', completedAt: null, completedBy: null, status: 'in_progress', blockedReason: null, waivedReason: null, dependency: [], priority: 'high', sequence: 1, notes: '3 invoices pending approval', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-10T09:00:00Z' },
    { id: 'ct-002', tenantId: 'tenant-acme', entityId: 'entity-us', periodId: 'period-2025-01', name: 'Post all AR invoices', description: 'Ensure all customer invoices for the period are posted', category: 'journal_entry', ownerId: 'user-accountant', ownerName: 'Maria Rodriguez', reviewerId: 'user-manager', reviewerName: 'James Wilson', dueDate: '2025-01-15', dueTime: '17:00', completedAt: null, completedBy: null, status: 'in_progress', blockedReason: null, waivedReason: null, dependency: [], priority: 'high', sequence: 2, notes: null, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-10T09:00:00Z' },
    { id: 'ct-003', tenantId: 'tenant-acme', entityId: 'entity-us', periodId: 'period-2025-01', name: 'Post prepaid amortizations', description: 'Run ScheduleIQ amortization for all prepaid schedules', category: 'journal_entry', ownerId: 'user-accountant', ownerName: 'Maria Rodriguez', reviewerId: null, reviewerName: null, dueDate: '2025-01-17', dueTime: '17:00', completedAt: null, completedBy: null, status: 'not_started', blockedReason: null, waivedReason: null, dependency: ['ct-001', 'ct-002'], priority: 'high', sequence: 3, notes: null, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
    { id: 'ct-004', tenantId: 'tenant-acme', entityId: 'entity-us', periodId: 'period-2025-01', name: 'Post accruals', description: 'Post month-end accrual entries (payroll, interest, etc.)', category: 'journal_entry', ownerId: 'user-accountant', ownerName: 'Maria Rodriguez', reviewerId: 'user-manager', reviewerName: 'James Wilson', dueDate: '2025-01-17', dueTime: '17:00', completedAt: null, completedBy: null, status: 'not_started', blockedReason: null, waivedReason: null, dependency: [], priority: 'critical', sequence: 4, notes: null, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
    { id: 'ct-005', tenantId: 'tenant-acme', entityId: 'entity-us', periodId: 'period-2025-01', name: 'Bank reconciliation — Operating', description: 'Reconcile operating checking account to bank statement', category: 'reconciliation', ownerId: 'user-accountant', ownerName: 'Maria Rodriguez', reviewerId: 'user-manager', reviewerName: 'James Wilson', dueDate: '2025-01-20', dueTime: '17:00', completedAt: null, completedBy: null, status: 'not_started', blockedReason: null, waivedReason: null, dependency: ['ct-001'], priority: 'critical', sequence: 5, notes: null, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
    { id: 'ct-006', tenantId: 'tenant-acme', entityId: 'entity-us', periodId: 'period-2025-01', name: 'AR reconciliation', description: 'Reconcile AR sub-ledger to control account', category: 'reconciliation', ownerId: 'user-accountant', ownerName: 'Maria Rodriguez', reviewerId: 'user-manager', reviewerName: 'James Wilson', dueDate: '2025-01-20', dueTime: '17:00', completedAt: null, completedBy: null, status: 'not_started', blockedReason: null, waivedReason: null, dependency: ['ct-002'], priority: 'high', sequence: 6, notes: null, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
    { id: 'ct-007', tenantId: 'tenant-acme', entityId: 'entity-us', periodId: 'period-2025-01', name: 'Depreciation run', description: 'Run fixed asset depreciation for the period', category: 'journal_entry', ownerId: 'user-accountant', ownerName: 'Maria Rodriguez', reviewerId: null, reviewerName: null, dueDate: '2025-01-18', dueTime: '17:00', completedAt: null, completedBy: null, status: 'not_started', blockedReason: null, waivedReason: null, dependency: [], priority: 'high', sequence: 7, notes: null, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
    { id: 'ct-008', tenantId: 'tenant-acme', entityId: 'entity-us', periodId: 'period-2025-01', name: 'Controller sign-off', description: 'Finance controller final review and period close authorization', category: 'sign_off', ownerId: 'user-controller', ownerName: 'Sarah Chen', reviewerId: null, reviewerName: null, dueDate: '2025-01-25', dueTime: '17:00', completedAt: null, completedBy: null, status: 'not_started', blockedReason: null, waivedReason: null, dependency: ['ct-003', 'ct-004', 'ct-005', 'ct-006', 'ct-007'], priority: 'critical', sequence: 8, notes: null, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  ]

  for (const t of tasks) _tasks.set(t.id, t)

  const completedCount = tasks.filter((t) => t.status === 'completed').length
  const checklist: CloseChecklist = {
    id: 'cl-2025-01', tenantId: 'tenant-acme', entityId: 'entity-us', periodId: 'period-2025-01',
    periodLabel: 'Jan 2025', tasks, totalTasks: tasks.length, completedTasks: completedCount,
    blockedTasks: tasks.filter((t) => t.status === 'blocked').length,
    completionPct: Math.round((completedCount / tasks.length) * 100),
    estimatedCloseDate: '2025-01-25', actualCloseDate: null, status: 'in_progress',
    createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-10T09:00:00Z',
  }
  _checklists.set(checklist.id, checklist)
})()

export class CloseIQService {
  static async getChecklist(ctx: ServiceContext, periodId: string): Promise<CloseChecklist | null> {
    return Array.from(_checklists.values()).find((c) => c.tenantId === ctx.tenantId && c.entityId === ctx.entityId && c.periodId === periodId) ?? null
  }

  static async getTasks(ctx: ServiceContext, periodId: string): Promise<CloseTask[]> {
    return Array.from(_tasks.values())
      .filter((t) => t.tenantId === ctx.tenantId && t.entityId === ctx.entityId && t.periodId === periodId)
      .sort((a, b) => a.sequence - b.sequence)
  }

  static async completeTask(ctx: ServiceContext, taskId: string): Promise<CloseTask> {
    const task = _tasks.get(taskId)
    if (!task) throw new Error('Task not found')

    // Check dependencies
    const blockedDeps = task.dependency.filter((depId) => {
      const dep = _tasks.get(depId)
      return dep && dep.status !== 'completed'
    })
    if (blockedDeps.length > 0) {
      throw new Error(`Cannot complete: dependencies not yet complete: ${blockedDeps.join(', ')}`)
    }

    const now = new Date().toISOString()
    const updated: CloseTask = { ...task, status: 'completed' as CloseTaskStatus, completedAt: now, completedBy: ctx.userId, updatedAt: now }
    _tasks.set(taskId, updated)
    await AuditService.log(ctx, 'close.task_completed', { sourceModule: 'closeiq', resourceType: 'close_task', resourceId: taskId, description: `Close task "${task.name}" marked complete` })

    // Update checklist
    await this._refreshChecklist(ctx, task.periodId)
    return updated
  }

  static async getCalendar(ctx: ServiceContext): Promise<CloseCalendarEntry[]> {
    const periods = PeriodEngine.getPeriodsForEntity(ctx.tenantId, ctx.entityId)
    return periods.map((p) => {
      const label = `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][p.month - 1]} ${p.year}`
      const checklist = Array.from(_checklists.values()).find((c) => c.periodId === p.id)
      return {
        periodId: p.id, periodLabel: label, year: p.year, month: p.month, status: p.status,
        taskCount: checklist?.totalTasks ?? 0, completedCount: checklist?.completedTasks ?? 0,
        targetCloseDate: `${p.year}-${String(p.month).padStart(2, '0')}-25`,
        actualCloseDate: p.closedAt ? p.closedAt.slice(0, 10) : null,
        daysToClose: p.closedAt ? null : null,
      }
    })
  }

  private static async _refreshChecklist(ctx: ServiceContext, periodId: string): Promise<void> {
    const checklists = Array.from(_checklists.values())
    const checklist = checklists.find((c) => c.tenantId === ctx.tenantId && c.entityId === ctx.entityId && c.periodId === periodId)
    if (!checklist) return
    const tasks = await this.getTasks(ctx, periodId)
    const completedTasks = tasks.filter((t) => t.status === 'completed').length
    const updated = { ...checklist, tasks, completedTasks, completionPct: Math.round((completedTasks / tasks.length) * 100), updatedAt: new Date().toISOString() }
    _checklists.set(checklist.id, updated)
  }

  static async createTask(ctx: ServiceContext, data: Omit<CloseTask, 'id' | 'tenantId' | 'entityId' | 'status' | 'completedAt' | 'completedBy' | 'blockedReason' | 'waivedReason' | 'createdAt' | 'updatedAt'>): Promise<CloseTask> {
    const task: CloseTask = { id: generateId(), tenantId: ctx.tenantId, entityId: ctx.entityId, status: 'not_started', completedAt: null, completedBy: null, blockedReason: null, waivedReason: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...data }
    _tasks.set(task.id, task)
    return task
  }
}
