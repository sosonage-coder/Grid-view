import type { ServiceContext } from '../../platform/types/core'
import { AuditService } from '../../platform/services/audit.service'
import { generateId } from '../../engine/ledger.engine'
import type { ReconWorksheet, ReconItem, ReconStatus } from './types'

const _worksheets: Map<string, ReconWorksheet> = new Map()
const _items: Map<string, ReconItem> = new Map()

;(function seed() {
  const ws: ReconWorksheet[] = [
    { id: 'recon-001', tenantId: 'tenant-acme', entityId: 'entity-us', accountId: 'acc-1010', accountCode: '1010', accountName: 'Cash — Operating Checking', periodId: 'period-2024-11', periodLabel: 'Nov 2024', glBalance: 2847500, reconciledBalance: 2847500, unreconciledBalance: 0, status: 'approved', preparedBy: 'user-accountant', preparedAt: '2024-12-05T10:00:00Z', reviewedBy: 'user-manager', reviewedAt: '2024-12-06T14:00:00Z', approvedBy: 'user-controller', approvedAt: '2024-12-07T09:00:00Z', notes: null, currency: 'USD', createdAt: '2024-12-01T09:00:00Z', updatedAt: '2024-12-07T09:00:00Z' },
    { id: 'recon-002', tenantId: 'tenant-acme', entityId: 'entity-us', accountId: 'acc-2010', accountCode: '2010', accountName: 'Accounts Payable', periodId: 'period-2024-11', periodLabel: 'Nov 2024', glBalance: 98600, reconciledBalance: 98600, unreconciledBalance: 0, status: 'approved', preparedBy: 'user-accountant', preparedAt: '2024-12-05T11:00:00Z', reviewedBy: 'user-manager', reviewedAt: '2024-12-06T14:30:00Z', approvedBy: 'user-controller', approvedAt: '2024-12-07T09:30:00Z', notes: null, currency: 'USD', createdAt: '2024-12-01T09:00:00Z', updatedAt: '2024-12-07T09:30:00Z' },
    { id: 'recon-003', tenantId: 'tenant-acme', entityId: 'entity-us', accountId: 'acc-1200', accountCode: '1200', accountName: 'Prepaid Expenses', periodId: 'period-2024-12', periodLabel: 'Dec 2024', glBalance: 185000, reconciledBalance: 162000, unreconciledBalance: 23000, status: 'in_progress', preparedBy: 'user-accountant', preparedAt: '2025-01-05T09:00:00Z', reviewedBy: null, reviewedAt: null, approvedBy: null, approvedAt: null, notes: 'Insurance renewal not yet recorded', currency: 'USD', createdAt: '2025-01-03T09:00:00Z', updatedAt: '2025-01-05T09:00:00Z' },
    { id: 'recon-004', tenantId: 'tenant-acme', entityId: 'entity-us', accountId: 'acc-1100', accountCode: '1100', accountName: 'Accounts Receivable', periodId: 'period-2024-12', periodLabel: 'Dec 2024', glBalance: 290000, reconciledBalance: 290000, unreconciledBalance: 0, status: 'prepared', preparedBy: 'user-accountant', preparedAt: '2025-01-06T10:00:00Z', reviewedBy: null, reviewedAt: null, approvedBy: null, approvedAt: null, notes: null, currency: 'USD', createdAt: '2025-01-03T09:00:00Z', updatedAt: '2025-01-06T10:00:00Z' },
  ]
  for (const w of ws) _worksheets.set(w.id, w)
})()

export class ReconcileIQService {
  static async getWorksheets(ctx: ServiceContext): Promise<ReconWorksheet[]> {
    return Array.from(_worksheets.values())
      .filter((w) => w.tenantId === ctx.tenantId && w.entityId === ctx.entityId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  static async getWorksheet(ctx: ServiceContext, id: string): Promise<ReconWorksheet> {
    const ws = _worksheets.get(id)
    if (!ws || ws.tenantId !== ctx.tenantId) throw new Error('Worksheet not found')
    return ws
  }

  static async getItems(worksheetId: string): Promise<ReconItem[]> {
    return Array.from(_items.values()).filter((i) => i.worksheetId === worksheetId)
  }

  static async createWorksheet(ctx: ServiceContext, data: Pick<ReconWorksheet, 'accountId' | 'accountCode' | 'accountName' | 'periodId' | 'periodLabel' | 'glBalance' | 'currency'>): Promise<ReconWorksheet> {
    const ws: ReconWorksheet = {
      id: generateId(), tenantId: ctx.tenantId, entityId: ctx.entityId,
      ...data, reconciledBalance: 0, unreconciledBalance: data.glBalance,
      status: 'open', preparedBy: null, preparedAt: null, reviewedBy: null, reviewedAt: null,
      approvedBy: null, approvedAt: null, notes: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }
    _worksheets.set(ws.id, ws)
    return ws
  }

  static async submitForReview(ctx: ServiceContext, worksheetId: string): Promise<ReconWorksheet> {
    const ws = await this.getWorksheet(ctx, worksheetId)
    const now = new Date().toISOString()
    const updated = { ...ws, status: 'prepared' as ReconStatus, preparedBy: ctx.userId, preparedAt: now, updatedAt: now }
    _worksheets.set(worksheetId, updated)
    await AuditService.log(ctx, 'reconciliation.started', { sourceModule: 'reconcileiq', resourceType: 'recon_worksheet', resourceId: worksheetId, description: `Reconciliation ${ws.accountName} ${ws.periodLabel} submitted for review` })
    return updated
  }

  static async approve(ctx: ServiceContext, worksheetId: string): Promise<ReconWorksheet> {
    const ws = await this.getWorksheet(ctx, worksheetId)
    if (ws.preparedBy === ctx.userId) throw new Error('SoD violation: preparer cannot approve')
    const now = new Date().toISOString()
    const updated = { ...ws, status: 'approved' as ReconStatus, approvedBy: ctx.userId, approvedAt: now, updatedAt: now }
    _worksheets.set(worksheetId, updated)
    await AuditService.log(ctx, 'reconciliation.approved', { sourceModule: 'reconcileiq', resourceType: 'recon_worksheet', resourceId: worksheetId, description: `Reconciliation ${ws.accountName} ${ws.periodLabel} approved` })
    return updated
  }

  static async addItem(ctx: ServiceContext, worksheetId: string, data: Pick<ReconItem, 'description' | 'amount' | 'currency' | 'transactionDate' | 'referenceId' | 'referenceType'>): Promise<ReconItem> {
    const item: ReconItem = { id: generateId(), worksheetId, ...data, status: 'open', matchedItemId: null, notes: null, addedBy: ctx.userId, addedAt: new Date().toISOString() }
    _items.set(item.id, item)
    return item
  }
}
