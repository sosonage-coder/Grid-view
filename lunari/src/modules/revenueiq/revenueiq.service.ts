import type { ServiceContext } from '../../platform/types/core'
import { generateId } from '../../engine/ledger.engine'
import type { RevenueContract } from './types'

const _contracts: Map<string, RevenueContract> = new Map()

;(function seed() {
  const contracts: RevenueContract[] = [
    { id: 'rev-001', tenantId: 'tenant-acme', entityId: 'entity-us', customerId: 'cust-001', customerName: 'Globex Industries', contractNumber: 'CONT-2024-001', contractDate: '2024-01-01', currency: 'USD', totalTransactionPrice: 360000, recognizedRevenue: 300000, deferredRevenue: 60000, status: 'active', obligations: [{ id: 'ob-001', contractId: 'rev-001', description: 'Software subscription — annual', standaloneSellingPrice: 240000, allocatedTransactionPrice: 240000, recognizedAmount: 200000, deferredAmount: 40000, status: 'partially_satisfied', recognitionMethod: 'over_time', startDate: '2024-01-01', endDate: '2024-12-31', completionPct: 83 }, { id: 'ob-002', contractId: 'rev-001', description: 'Implementation services', standaloneSellingPrice: 120000, allocatedTransactionPrice: 120000, recognizedAmount: 100000, deferredAmount: 20000, status: 'partially_satisfied', recognitionMethod: 'over_time', startDate: '2024-01-01', endDate: '2024-12-31', completionPct: 83 }], contractModifications: [], notes: null, createdBy: 'user-accountant', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-12-01T00:00:00Z' },
    { id: 'rev-002', tenantId: 'tenant-acme', entityId: 'entity-us', customerId: 'cust-002', customerName: 'Springfield Corp', contractNumber: 'CONT-2024-002', contractDate: '2024-03-01', currency: 'USD', totalTransactionPrice: 180000, recognizedRevenue: 150000, deferredRevenue: 30000, status: 'active', obligations: [{ id: 'ob-003', contractId: 'rev-002', description: 'Consulting retainer', standaloneSellingPrice: 180000, allocatedTransactionPrice: 180000, recognizedAmount: 150000, deferredAmount: 30000, status: 'partially_satisfied', recognitionMethod: 'over_time', startDate: '2024-03-01', endDate: '2025-02-28', completionPct: 83 }], contractModifications: [], notes: null, createdBy: 'user-accountant', createdAt: '2024-03-01T00:00:00Z', updatedAt: '2024-12-01T00:00:00Z' },
    { id: 'rev-003', tenantId: 'tenant-acme', entityId: 'entity-us', customerId: 'cust-004', customerName: 'Umbrella Ventures', contractNumber: 'CONT-2025-001', contractDate: '2025-01-01', currency: 'USD', totalTransactionPrice: 480000, recognizedRevenue: 0, deferredRevenue: 480000, status: 'active', obligations: [{ id: 'ob-004', contractId: 'rev-003', description: 'Platform subscription 2025', standaloneSellingPrice: 480000, allocatedTransactionPrice: 480000, recognizedAmount: 0, deferredAmount: 480000, status: 'unsatisfied', recognitionMethod: 'over_time', startDate: '2025-01-01', endDate: '2025-12-31', completionPct: 0 }], contractModifications: [], notes: null, createdBy: 'user-accountant', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  ]
  for (const c of contracts) _contracts.set(c.id, c)
})()

export class RevenueIQService {
  static async getContracts(ctx: ServiceContext): Promise<RevenueContract[]> {
    return Array.from(_contracts.values()).filter((c) => c.tenantId === ctx.tenantId && c.entityId === ctx.entityId)
  }

  static async createContract(ctx: ServiceContext, data: Omit<RevenueContract, 'id' | 'tenantId' | 'entityId' | 'recognizedRevenue' | 'deferredRevenue' | 'createdBy' | 'createdAt' | 'updatedAt'>): Promise<RevenueContract> {
    const contract: RevenueContract = { id: generateId(), tenantId: ctx.tenantId, entityId: ctx.entityId, recognizedRevenue: 0, deferredRevenue: data.totalTransactionPrice, createdBy: ctx.userId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...data }
    _contracts.set(contract.id, contract)
    return contract
  }
}
