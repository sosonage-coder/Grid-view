import type { ServiceContext } from '../../platform/types/core'
import { generateId } from '../../engine/ledger.engine'
import type { ComplianceObligation, Control, ComplianceEvidence, ControlMatrix } from './types'

const _obligations: Map<string, ComplianceObligation> = new Map()
const _controls: Map<string, Control> = new Map()
const _evidence: Map<string, ComplianceEvidence> = new Map()

;(function seed() {
  const controls: Control[] = [
    { id: 'ctrl-001', tenantId: 'tenant-acme', entityId: 'entity-us', controlId: 'CTRL-001', name: 'Journal Entry Approval', description: 'All manual journal entries require dual approval before posting', type: 'preventive', frequency: 'monthly', owner: 'user-controller', reviewer: 'user-manager', riskLevel: 'critical', status: 'effective', lastTestedDate: '2024-12-01', nextTestDate: '2025-03-01', framework: 'SOX', process: 'Financial Close', narrative: 'Journal entries are prepared by accountants and must be approved by a manager or controller before posting. Segregation of duties is enforced — preparers cannot approve their own entries.', evidence: [], createdAt: '2023-01-01T00:00:00Z', updatedAt: '2024-12-01T00:00:00Z' },
    { id: 'ctrl-002', tenantId: 'tenant-acme', entityId: 'entity-us', controlId: 'CTRL-002', name: 'Period Lock Control', description: 'Periods are locked after close to prevent retroactive changes', type: 'preventive', frequency: 'monthly', owner: 'user-controller', reviewer: null, riskLevel: 'high', status: 'effective', lastTestedDate: '2024-12-01', nextTestDate: '2025-03-01', framework: 'SOX', process: 'Financial Close', narrative: null, evidence: [], createdAt: '2023-01-01T00:00:00Z', updatedAt: '2024-12-01T00:00:00Z' },
    { id: 'ctrl-003', tenantId: 'tenant-acme', entityId: 'entity-us', controlId: 'CTRL-003', name: 'AP Three-Way Match', description: 'AP invoices are matched against PO and GRN before approval', type: 'detective', frequency: 'monthly', owner: 'user-manager', reviewer: 'user-controller', riskLevel: 'high', status: 'effective', lastTestedDate: '2024-11-15', nextTestDate: '2025-02-15', framework: 'SOX', process: 'Procure-to-Pay', narrative: null, evidence: [], createdAt: '2023-01-01T00:00:00Z', updatedAt: '2024-11-15T00:00:00Z' },
    { id: 'ctrl-004', tenantId: 'tenant-acme', entityId: 'entity-us', controlId: 'CTRL-004', name: 'Bank Reconciliation', description: 'All bank accounts reconciled monthly within 10 days of period end', type: 'detective', frequency: 'monthly', owner: 'user-accountant', reviewer: 'user-manager', riskLevel: 'critical', status: 'effective', lastTestedDate: '2024-12-10', nextTestDate: '2025-01-20', framework: 'SOX', process: 'Cash Management', narrative: null, evidence: [], createdAt: '2023-01-01T00:00:00Z', updatedAt: '2024-12-10T00:00:00Z' },
    { id: 'ctrl-005', tenantId: 'tenant-acme', entityId: 'entity-us', controlId: 'CTRL-005', name: 'Revenue Recognition Review', description: 'ASC 606 compliance review for each new contract', type: 'detective', frequency: 'ad_hoc', owner: 'user-controller', reviewer: null, riskLevel: 'critical', status: 'not_tested', lastTestedDate: null, nextTestDate: '2025-03-31', framework: 'GAAP', process: 'Revenue Recognition', narrative: null, evidence: [], createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' },
    { id: 'ctrl-006', tenantId: 'tenant-acme', entityId: 'entity-us', controlId: 'CTRL-006', name: 'Access User Provisioning Review', description: 'Quarterly review of user access rights', type: 'detective', frequency: 'quarterly', owner: 'user-controller', reviewer: null, riskLevel: 'medium', status: 'deficient', lastTestedDate: '2024-09-30', nextTestDate: '2024-12-31', framework: 'SOX', process: 'IT General Controls', narrative: 'Q3 review identified 2 terminated users still with active access. Remediated.', evidence: [], createdAt: '2023-01-01T00:00:00Z', updatedAt: '2024-10-15T00:00:00Z' },
  ]
  for (const c of controls) _controls.set(c.id, c)

  const obligations: ComplianceObligation[] = [
    { id: 'obl-001', tenantId: 'tenant-acme', entityId: 'entity-us', name: 'Quarterly Tax Filing', description: 'Federal and state quarterly estimated tax payments', regulatoryBody: 'IRS', framework: 'Tax', frequency: 'quarterly', nextDueDate: '2025-01-15', lastCompletedDate: '2024-10-15', status: 'active', owner: 'user-controller', riskLevel: 'critical', relatedControls: [], notes: null, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2024-10-15T00:00:00Z' },
    { id: 'obl-002', tenantId: 'tenant-acme', entityId: 'entity-us', name: 'SOX Annual Audit', description: 'Annual SOX 404 compliance audit', regulatoryBody: 'SEC', framework: 'SOX', frequency: 'annual', nextDueDate: '2025-03-31', lastCompletedDate: '2024-03-31', status: 'active', owner: 'user-controller', riskLevel: 'critical', relatedControls: ['ctrl-001', 'ctrl-002', 'ctrl-003', 'ctrl-004'], notes: null, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2024-03-31T00:00:00Z' },
  ]
  for (const o of obligations) _obligations.set(o.id, o)
})()

export class ComplianceHubService {
  static async getControls(ctx: ServiceContext): Promise<Control[]> {
    return Array.from(_controls.values()).filter((c) => c.tenantId === ctx.tenantId && c.entityId === ctx.entityId)
  }

  static async getObligations(ctx: ServiceContext): Promise<ComplianceObligation[]> {
    return Array.from(_obligations.values()).filter((o) => o.tenantId === ctx.tenantId && o.entityId === ctx.entityId)
  }

  static async getEvidence(ctx: ServiceContext, controlId?: string): Promise<ComplianceEvidence[]> {
    let evs = Array.from(_evidence.values()).filter((e) => e.tenantId === ctx.tenantId && e.entityId === ctx.entityId)
    if (controlId) evs = evs.filter((e) => e.controlId === controlId)
    return evs
  }

  static async getControlMatrix(ctx: ServiceContext): Promise<ControlMatrix> {
    const controls = await this.getControls(ctx)
    const matrix: ControlMatrix = { entityId: ctx.entityId, totalControls: controls.length, effectiveControls: 0, deficientControls: 0, materialWeaknesses: 0, notTested: 0, byRisk: { critical: 0, high: 0, medium: 0, low: 0 }, byProcess: {} }
    for (const c of controls) {
      if (c.status === 'effective') matrix.effectiveControls++
      else if (c.status === 'deficient') matrix.deficientControls++
      else if (c.status === 'material_weakness') matrix.materialWeaknesses++
      else if (c.status === 'not_tested') matrix.notTested++
      matrix.byRisk[c.riskLevel]++
      matrix.byProcess[c.process] = (matrix.byProcess[c.process] ?? 0) + 1
    }
    return matrix
  }

  static async submitEvidence(ctx: ServiceContext, data: Omit<ComplianceEvidence, 'id' | 'tenantId' | 'entityId' | 'reviewedBy' | 'reviewedAt' | 'rejectionReason' | 'createdAt'>): Promise<ComplianceEvidence> {
    const ev: ComplianceEvidence = { id: generateId(), tenantId: ctx.tenantId, entityId: ctx.entityId, reviewedBy: null, reviewedAt: null, rejectionReason: null, createdAt: new Date().toISOString(), ...data }
    _evidence.set(ev.id, ev)
    return ev
  }
}
