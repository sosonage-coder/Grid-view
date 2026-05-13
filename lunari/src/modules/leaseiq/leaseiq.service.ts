import type { ServiceContext } from '../../platform/types/core'
import { generateId } from '../../engine/ledger.engine'
import type { Lease, LeaseScheduleLine } from './types'

const _leases: Map<string, Lease> = new Map()
const _schedules: Map<string, LeaseScheduleLine[]> = new Map()

;(function seed() {
  const leases: Lease[] = [
    { id: 'lease-001', tenantId: 'tenant-acme', entityId: 'entity-us', leaseNumber: 'LEASE-2022-001', description: 'HQ Office Space — 500 Market St', lessor: 'Landmark Properties LLC', assetDescription: 'Office space floors 12-14, 500 Market St, San Francisco CA', assetCategory: 'real_estate', leaseType: 'operating', classification: 'standard', commencementDate: '2022-01-01', expirationDate: '2026-12-31', termMonths: 60, renewalOptions: 60, purchaseOption: false, currency: 'USD', monthlyPayment: 45000, annualEscalation: 3, discountRate: 0.045, rightOfUseAsset: 2318500, leaseLiability: 2318500, accumulatedAmortization: 876500, currentLiability: 504000, longTermLiability: 938000, status: 'active', glRoaAccountId: 'acc-1500', glLiabilityAccountId: 'acc-2100', glAmortizationAccountId: 'acc-5080', glInterestAccountId: 'acc-5090', notes: null, createdBy: 'user-accountant', createdAt: '2022-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
    { id: 'lease-002', tenantId: 'tenant-acme', entityId: 'entity-us', leaseNumber: 'LEASE-2023-001', description: 'Fleet vehicles — 10 units', lessor: 'AutoFleet Corp', assetDescription: '10x Company vehicles — various models', assetCategory: 'vehicles', leaseType: 'finance', classification: 'standard', commencementDate: '2023-07-01', expirationDate: '2026-06-30', termMonths: 36, renewalOptions: 0, purchaseOption: true, currency: 'USD', monthlyPayment: 18000, annualEscalation: 0, discountRate: 0.055, rightOfUseAsset: 593000, leaseLiability: 593000, accumulatedAmortization: 197600, currentLiability: 198000, longTermLiability: 197400, status: 'active', glRoaAccountId: 'acc-1510', glLiabilityAccountId: 'acc-2110', glAmortizationAccountId: 'acc-5080', glInterestAccountId: 'acc-5090', notes: null, createdBy: 'user-accountant', createdAt: '2023-07-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
    { id: 'lease-003', tenantId: 'tenant-acme', entityId: 'entity-us', leaseNumber: 'LEASE-2024-001', description: 'Data center equipment', lessor: 'TechLease Inc', assetDescription: 'Server rack equipment — 20 units', assetCategory: 'equipment', leaseType: 'finance', classification: 'standard', commencementDate: '2024-01-01', expirationDate: '2027-12-31', termMonths: 48, renewalOptions: 0, purchaseOption: false, currency: 'USD', monthlyPayment: 12500, annualEscalation: 2, discountRate: 0.06, rightOfUseAsset: 530000, leaseLiability: 530000, accumulatedAmortization: 132500, currentLiability: 138000, longTermLiability: 259500, status: 'active', glRoaAccountId: 'acc-1520', glLiabilityAccountId: 'acc-2120', glAmortizationAccountId: 'acc-5080', glInterestAccountId: 'acc-5090', notes: null, createdBy: 'user-accountant', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  ]
  for (const l of leases) _leases.set(l.id, l)
})()

export class LeaseIQService {
  static async getLeases(ctx: ServiceContext): Promise<Lease[]> {
    return Array.from(_leases.values()).filter((l) => l.tenantId === ctx.tenantId && l.entityId === ctx.entityId)
  }

  static async getLease(ctx: ServiceContext, leaseId: string): Promise<Lease> {
    const lease = _leases.get(leaseId)
    if (!lease || lease.tenantId !== ctx.tenantId) throw new Error('Lease not found')
    return lease
  }

  static async getSchedule(leaseId: string): Promise<LeaseScheduleLine[]> {
    return _schedules.get(leaseId) ?? []
  }

  static async createLease(ctx: ServiceContext, data: Omit<Lease, 'id' | 'tenantId' | 'entityId' | 'accumulatedAmortization' | 'currentLiability' | 'longTermLiability' | 'createdBy' | 'createdAt' | 'updatedAt'>): Promise<Lease> {
    const lease: Lease = { id: generateId(), tenantId: ctx.tenantId, entityId: ctx.entityId, accumulatedAmortization: 0, currentLiability: data.leaseLiability, longTermLiability: 0, createdBy: ctx.userId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...data }
    _leases.set(lease.id, lease)
    return lease
  }
}
