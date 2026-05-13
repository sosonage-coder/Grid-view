import type { ServiceContext } from '../../platform/types/core'
import { generateId } from '../../engine/ledger.engine'
import type { PrepaidSchedule, AccrualEntry } from './types'

const _prepaids: Map<string, PrepaidSchedule> = new Map()
const _accruals: Map<string, AccrualEntry> = new Map()

;(function seed() {
  const prepaids: PrepaidSchedule[] = [
    { id: 'pre-001', tenantId: 'tenant-acme', entityId: 'entity-us', description: 'D&O Insurance Policy 2024-2025', vendor: 'Chubb Insurance', invoiceId: null, startDate: '2024-07-01', endDate: '2025-06-30', totalAmount: 120000, amortizedAmount: 60000, remainingAmount: 60000, currency: 'USD', prepaidAccountId: 'acc-1200', prepaidAccountCode: '1200', expenseAccountId: 'acc-5060', expenseAccountCode: '5060', amortizationMethod: 'straight_line', monthlyAmount: 10000, status: 'active', createdBy: 'user-accountant', createdAt: '2024-07-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z', lines: Array.from({ length: 12 }, (_, i) => ({ id: `pre-001-line-${i}`, prepaidId: 'pre-001', periodId: `period-2024-${String(i + 7).padStart(2, '0')}`, periodLabel: `${['Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun'][i]} ${i < 6 ? 2024 : 2025}`, amount: 10000, journalId: i < 6 ? `jnl-pre-001-${i}` : null, postedAt: i < 6 ? `2024-${String(i + 7).padStart(2, '0')}-31T23:59:00Z` : null, status: i < 6 ? 'posted' as const : 'scheduled' as const })) },
    { id: 'pre-002', tenantId: 'tenant-acme', entityId: 'entity-us', description: 'Office Lease Prepayment Q1 2025', vendor: 'Landmark Properties', invoiceId: null, startDate: '2025-01-01', endDate: '2025-03-31', totalAmount: 45000, amortizedAmount: 0, remainingAmount: 45000, currency: 'USD', prepaidAccountId: 'acc-1200', prepaidAccountCode: '1200', expenseAccountId: 'acc-5070', expenseAccountCode: '5070', amortizationMethod: 'straight_line', monthlyAmount: 15000, status: 'active', createdBy: 'user-accountant', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z', lines: [{ id: 'pre-002-line-1', prepaidId: 'pre-002', periodId: 'period-2025-01', periodLabel: 'Jan 2025', amount: 15000, journalId: null, postedAt: null, status: 'scheduled' as const }, { id: 'pre-002-line-2', prepaidId: 'pre-002', periodId: 'period-2025-02', periodLabel: 'Feb 2025', amount: 15000, journalId: null, postedAt: null, status: 'scheduled' as const }, { id: 'pre-002-line-3', prepaidId: 'pre-002', periodId: 'period-2025-03', periodLabel: 'Mar 2025', amount: 15000, journalId: null, postedAt: null, status: 'scheduled' as const }] },
  ]
  for (const p of prepaids) _prepaids.set(p.id, p)

  const accruals: AccrualEntry[] = [
    { id: 'acc-e-001', tenantId: 'tenant-acme', entityId: 'entity-us', description: 'December payroll accrual', accrualDate: '2024-12-31', reversalDate: '2025-01-01', amount: 285000, currency: 'USD', debitAccountId: 'acc-5100', debitAccountCode: '5100', creditAccountId: 'acc-2050', creditAccountCode: '2050', journalId: 'jnl-accrual-001', reversalJournalId: null, status: 'open', category: 'payroll', recurring: true, recurringMonths: 1, notes: null, createdBy: 'user-accountant', createdAt: '2024-12-31T00:00:00Z', updatedAt: '2024-12-31T00:00:00Z' },
    { id: 'acc-e-002', tenantId: 'tenant-acme', entityId: 'entity-us', description: 'Q4 audit fees accrual', accrualDate: '2024-12-31', reversalDate: '2025-01-15', amount: 45000, currency: 'USD', debitAccountId: 'acc-5040', debitAccountCode: '5040', creditAccountId: 'acc-2060', creditAccountCode: '2060', journalId: 'jnl-accrual-002', reversalJournalId: null, status: 'open', category: 'expense', recurring: false, recurringMonths: null, notes: 'Estimated based on prior year', createdBy: 'user-accountant', createdAt: '2024-12-31T00:00:00Z', updatedAt: '2024-12-31T00:00:00Z' },
  ]
  for (const a of accruals) _accruals.set(a.id, a)
})()

export class ScheduleIQService {
  static async getPrepaids(ctx: ServiceContext): Promise<PrepaidSchedule[]> {
    return Array.from(_prepaids.values()).filter((p) => p.tenantId === ctx.tenantId && p.entityId === ctx.entityId)
  }

  static async getAccruals(ctx: ServiceContext): Promise<AccrualEntry[]> {
    return Array.from(_accruals.values()).filter((a) => a.tenantId === ctx.tenantId && a.entityId === ctx.entityId)
  }

  static async createPrepaid(ctx: ServiceContext, data: Omit<PrepaidSchedule, 'id' | 'tenantId' | 'entityId' | 'amortizedAmount' | 'remainingAmount' | 'status' | 'createdBy' | 'createdAt' | 'updatedAt' | 'lines'>): Promise<PrepaidSchedule> {
    const months = Math.ceil((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
    const prepaid: PrepaidSchedule = { id: generateId(), tenantId: ctx.tenantId, entityId: ctx.entityId, amortizedAmount: 0, remainingAmount: data.totalAmount, status: 'active', createdBy: ctx.userId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), lines: [], ...data }
    prepaid.lines = Array.from({ length: months }, (_, i) => {
      const d = new Date(data.startDate)
      d.setMonth(d.getMonth() + i)
      return { id: generateId(), prepaidId: prepaid.id, periodId: `period-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, periodLabel: `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]} ${d.getFullYear()}`, amount: data.monthlyAmount, journalId: null, postedAt: null, status: 'scheduled' as const }
    })
    _prepaids.set(prepaid.id, prepaid)
    return prepaid
  }

  static async createAccrual(ctx: ServiceContext, data: Omit<AccrualEntry, 'id' | 'tenantId' | 'entityId' | 'journalId' | 'reversalJournalId' | 'status' | 'createdBy' | 'createdAt' | 'updatedAt'>): Promise<AccrualEntry> {
    const accrual: AccrualEntry = { id: generateId(), tenantId: ctx.tenantId, entityId: ctx.entityId, journalId: null, reversalJournalId: null, status: 'open', createdBy: ctx.userId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...data }
    _accruals.set(accrual.id, accrual)
    return accrual
  }
}
