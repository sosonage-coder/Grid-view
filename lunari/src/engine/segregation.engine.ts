import type { UserRole } from '../platform/types/core'
import type { Permission, SegregationRule, SoDViolation } from '../platform/types/permissions'
import { ROLE_PERMISSIONS } from '../platform/types/permissions'

// ─── Built-in SoD rules ───────────────────────────────────────────────────────

export const BUILTIN_SOD_RULES: SegregationRule[] = [
  {
    id: 'SOD-001',
    tenantId: '*',
    name: 'Self-approval prohibited',
    description: 'A journal preparer cannot approve their own journal',
    conflictingRoles: [],
    conflictingPermissions: [['journal:create', 'journal:approve']],
    isActive: true,
  },
  {
    id: 'SOD-002',
    tenantId: '*',
    name: 'Invoice creation and payment approval',
    description: 'The creator of an AP invoice cannot run the payment for that invoice',
    conflictingRoles: [],
    conflictingPermissions: [['ap:create', 'ap:payment_run']],
    isActive: true,
  },
  {
    id: 'SOD-003',
    tenantId: '*',
    name: 'Reconciliation preparation and approval',
    description: 'The preparer of a reconciliation cannot also approve it',
    conflictingRoles: [],
    conflictingPermissions: [['recon:create', 'recon:approve']],
    isActive: true,
  },
  {
    id: 'SOD-004',
    tenantId: '*',
    name: 'Period lock self-service',
    description: 'A user who closes a period should not be the same user who unlocks it',
    conflictingRoles: [],
    conflictingPermissions: [['period:close', 'period:unlock']],
    isActive: false, // warning only
  },
]

// ─── SegregationEngine ────────────────────────────────────────────────────────

export class SegregationEngine {
  /**
   * Check if a user performing an action (e.g., approving) conflicts with another
   * user who already performed a prior action (e.g., preparing) on the same document.
   */
  static checkUserConflict(
    actorUserId: string,
    priorActorUserId: string,
    action: string,
    priorAction: string,
  ): SoDViolation | null {
    if (actorUserId === priorActorUserId) {
      return {
        ruleId: 'SOD-001',
        ruleName: 'Self-approval prohibited',
        description: `The user who performed "${priorAction}" cannot also perform "${action}" on the same document`,
        severity: 'blocking',
      }
    }
    return null
  }

  /**
   * Check whether a user's role grants two conflicting permissions
   * that violate a SoD rule. Used for user setup validation.
   */
  static checkRolePermissionConflict(role: UserRole): SoDViolation[] {
    const userPermissions = ROLE_PERMISSIONS[role] ?? []
    const violations: SoDViolation[] = []

    for (const rule of BUILTIN_SOD_RULES) {
      if (!rule.isActive) continue
      for (const permPair of rule.conflictingPermissions) {
        const hasAll = permPair.every((p) => userPermissions.includes(p as Permission))
        if (hasAll) {
          violations.push({
            ruleId: rule.id,
            ruleName: rule.name,
            description: `Role "${role}" has conflicting permissions: ${permPair.join(' + ')}`,
            severity: 'blocking',
          })
        }
      }
    }

    return violations
  }

  /**
   * Validate that a specific user action on a document doesn't violate SoD.
   * Returns null if clean, or the violation if blocked.
   */
  static validateAction(params: {
    actorUserId: string
    documentPreparerId: string
    documentApproverId?: string | null
    action: 'approve' | 'post' | 'payment_run' | 'reconcile_approve'
  }): SoDViolation | null {
    const { actorUserId, documentPreparerId, documentApproverId: _documentApproverId, action } = params

    if (['approve', 'post'].includes(action)) {
      if (actorUserId === documentPreparerId) {
        return {
          ruleId: 'SOD-001',
          ruleName: 'Self-approval prohibited',
          description: `The preparer of this document cannot ${action} it`,
          severity: 'blocking',
        }
      }
    }

    if (action === 'payment_run') {
      if (actorUserId === documentPreparerId) {
        return {
          ruleId: 'SOD-002',
          ruleName: 'Invoice creation and payment approval',
          description: 'The invoice creator cannot run payment for this invoice',
          severity: 'blocking',
        }
      }
    }

    if (action === 'reconcile_approve') {
      if (actorUserId === documentPreparerId) {
        return {
          ruleId: 'SOD-003',
          ruleName: 'Reconciliation preparation and approval',
          description: 'The reconciliation preparer cannot approve their own reconciliation',
          severity: 'blocking',
        }
      }
    }

    return null
  }

  static getRulesForTenant(tenantId: string): SegregationRule[] {
    return BUILTIN_SOD_RULES.filter((r) => r.tenantId === '*' || r.tenantId === tenantId)
  }
}
