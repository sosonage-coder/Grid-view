import type { UserRole } from './core'

// ─── Permissions ──────────────────────────────────────────────────────────────

export type Permission =
  // Journals
  | 'journal:create'
  | 'journal:submit'
  | 'journal:approve'
  | 'journal:post'
  | 'journal:reverse'
  | 'journal:view'
  // Periods
  | 'period:close'
  | 'period:lock'
  | 'period:unlock'
  | 'period:view'
  // AP
  | 'ap:create'
  | 'ap:approve'
  | 'ap:post'
  | 'ap:void'
  | 'ap:view'
  | 'ap:payment_run'
  // AR
  | 'ar:create'
  | 'ar:approve'
  | 'ar:post'
  | 'ar:void'
  | 'ar:view'
  // Cash
  | 'cash:view'
  | 'cash:reconcile'
  | 'cash:approve_recon'
  // Reconciliation
  | 'recon:create'
  | 'recon:complete'
  | 'recon:approve'
  | 'recon:view'
  // Close
  | 'close:manage'
  | 'close:view'
  // Assets
  | 'asset:create'
  | 'asset:depreciate'
  | 'asset:dispose'
  | 'asset:view'
  // Revenue
  | 'revenue:create'
  | 'revenue:recognize'
  | 'revenue:view'
  // Leases
  | 'lease:create'
  | 'lease:modify'
  | 'lease:view'
  // Compliance
  | 'compliance:view'
  | 'compliance:attest'
  | 'compliance:manage'
  // Statements
  | 'statements:view'
  | 'statements:export'
  // Audit
  | 'audit:view'
  | 'audit:export'
  // Admin
  | 'admin:users'
  | 'admin:entities'
  | 'admin:chart_of_accounts'
  | 'admin:settings'

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    'journal:create', 'journal:submit', 'journal:approve', 'journal:post',
    'journal:reverse', 'journal:view', 'period:close', 'period:lock',
    'period:unlock', 'period:view', 'ap:create', 'ap:approve', 'ap:post',
    'ap:void', 'ap:view', 'ap:payment_run', 'ar:create', 'ar:approve',
    'ar:post', 'ar:void', 'ar:view', 'cash:view', 'cash:reconcile',
    'cash:approve_recon', 'recon:create', 'recon:complete', 'recon:approve',
    'recon:view', 'close:manage', 'close:view', 'asset:create', 'asset:depreciate',
    'asset:dispose', 'asset:view', 'revenue:create', 'revenue:recognize',
    'revenue:view', 'lease:create', 'lease:modify', 'lease:view',
    'compliance:view', 'compliance:attest', 'compliance:manage',
    'statements:view', 'statements:export', 'audit:view', 'audit:export',
    'admin:users', 'admin:entities', 'admin:chart_of_accounts', 'admin:settings',
  ],
  tenant_admin: [
    'journal:create', 'journal:submit', 'journal:approve', 'journal:post',
    'journal:reverse', 'journal:view', 'period:close', 'period:lock',
    'period:unlock', 'period:view', 'ap:create', 'ap:approve', 'ap:post',
    'ap:void', 'ap:view', 'ap:payment_run', 'ar:create', 'ar:approve',
    'ar:post', 'ar:void', 'ar:view', 'cash:view', 'cash:reconcile',
    'cash:approve_recon', 'recon:create', 'recon:complete', 'recon:approve',
    'recon:view', 'close:manage', 'close:view', 'asset:create', 'asset:depreciate',
    'asset:dispose', 'asset:view', 'revenue:create', 'revenue:recognize',
    'revenue:view', 'lease:create', 'lease:modify', 'lease:view',
    'compliance:view', 'compliance:attest', 'compliance:manage',
    'statements:view', 'statements:export', 'audit:view', 'audit:export',
    'admin:users', 'admin:entities', 'admin:chart_of_accounts', 'admin:settings',
  ],
  finance_controller: [
    'journal:create', 'journal:submit', 'journal:approve', 'journal:post',
    'journal:reverse', 'journal:view', 'period:close', 'period:lock',
    'period:unlock', 'period:view', 'ap:create', 'ap:approve', 'ap:post',
    'ap:void', 'ap:view', 'ap:payment_run', 'ar:create', 'ar:approve',
    'ar:post', 'ar:void', 'ar:view', 'cash:view', 'cash:reconcile',
    'cash:approve_recon', 'recon:create', 'recon:complete', 'recon:approve',
    'recon:view', 'close:manage', 'close:view', 'asset:create', 'asset:depreciate',
    'asset:dispose', 'asset:view', 'revenue:create', 'revenue:recognize',
    'revenue:view', 'lease:create', 'lease:modify', 'lease:view',
    'compliance:view', 'compliance:attest', 'compliance:manage',
    'statements:view', 'statements:export', 'audit:view', 'audit:export',
    'admin:chart_of_accounts',
  ],
  finance_manager: [
    'journal:create', 'journal:submit', 'journal:approve', 'journal:post',
    'journal:view', 'period:close', 'period:view', 'ap:create', 'ap:approve',
    'ap:post', 'ap:view', 'ap:payment_run', 'ar:create', 'ar:approve',
    'ar:post', 'ar:view', 'cash:view', 'cash:reconcile', 'cash:approve_recon',
    'recon:create', 'recon:complete', 'recon:approve', 'recon:view',
    'close:manage', 'close:view', 'asset:create', 'asset:depreciate', 'asset:view',
    'revenue:create', 'revenue:recognize', 'revenue:view', 'lease:create', 'lease:view',
    'compliance:view', 'compliance:attest', 'statements:view', 'statements:export',
    'audit:view',
  ],
  accountant: [
    'journal:create', 'journal:submit', 'journal:view', 'period:view',
    'ap:create', 'ap:view', 'ar:create', 'ar:view', 'cash:view',
    'recon:create', 'recon:complete', 'recon:view', 'close:view',
    'asset:view', 'revenue:view', 'lease:view', 'compliance:view',
    'statements:view', 'audit:view',
  ],
  ap_clerk: [
    'journal:view', 'period:view', 'ap:create', 'ap:view', 'cash:view',
    'statements:view',
  ],
  ar_clerk: [
    'journal:view', 'period:view', 'ar:create', 'ar:view', 'cash:view',
    'statements:view',
  ],
  auditor: [
    'journal:view', 'period:view', 'ap:view', 'ar:view', 'cash:view',
    'recon:view', 'close:view', 'asset:view', 'revenue:view', 'lease:view',
    'compliance:view', 'statements:view', 'statements:export', 'audit:view', 'audit:export',
  ],
  read_only: [
    'journal:view', 'period:view', 'ap:view', 'ar:view', 'cash:view',
    'recon:view', 'close:view', 'asset:view', 'revenue:view', 'lease:view',
    'compliance:view', 'statements:view', 'audit:view',
  ],
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

// ─── Segregation of Duties ────────────────────────────────────────────────────

export interface SegregationRule {
  id: string
  tenantId: string
  name: string
  description: string
  conflictingRoles: UserRole[][]
  conflictingPermissions: Permission[][]
  isActive: boolean
}

export interface SoDViolation {
  ruleId: string
  ruleName: string
  description: string
  severity: 'blocking' | 'warning'
}

export function checkSoDViolation(
  preparerId: string,
  approverId: string,
): SoDViolation | null {
  if (preparerId === approverId) {
    return {
      ruleId: 'SOD-001',
      ruleName: 'Self-approval prohibited',
      description: 'The preparer of a journal cannot be its approver',
      severity: 'blocking',
    }
  }
  return null
}
