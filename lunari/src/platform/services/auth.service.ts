import type { Tenant, Entity, User, ServiceContext } from '../types/core'

// ─── Mock data ────────────────────────────────────────────────────────────────

export const MOCK_TENANT: Tenant = {
  id: 'tenant-acme',
  name: 'Acme Corp',
  slug: 'acme',
  plan: 'enterprise',
  settings: {
    defaultCurrency: 'USD',
    fiscalYearStartMonth: 1,
    enableMultiEntity: true,
    enableAIAssist: true,
    requireDualApproval: false,
    enforceSegregationOfDuties: true,
    allowPeriodUnlock: true,
    maxApprovalLayers: 2,
  },
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
}

export const MOCK_ENTITIES: Entity[] = [
  {
    id: 'entity-us',
    tenantId: 'tenant-acme',
    name: 'Acme US',
    legalName: 'Acme Corporation Inc.',
    currency: 'USD',
    countryCode: 'US',
    parentEntityId: null,
    fiscalYearEnd: '12-31',
    taxId: '12-3456789',
    isActive: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'entity-uk',
    tenantId: 'tenant-acme',
    name: 'Acme UK',
    legalName: 'Acme UK Limited',
    currency: 'GBP',
    countryCode: 'GB',
    parentEntityId: 'entity-us',
    fiscalYearEnd: '12-31',
    taxId: 'GB123456789',
    isActive: true,
    createdAt: '2023-03-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'entity-eu',
    tenantId: 'tenant-acme',
    name: 'Acme EU',
    legalName: 'Acme Europe GmbH',
    currency: 'EUR',
    countryCode: 'DE',
    parentEntityId: 'entity-us',
    fiscalYearEnd: '12-31',
    taxId: 'DE123456789',
    isActive: true,
    createdAt: '2023-06-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
]

export const MOCK_USERS: User[] = [
  {
    id: 'user-controller',
    tenantId: 'tenant-acme',
    email: 'controller@acme.com',
    name: 'Sarah Chen',
    role: 'finance_controller',
    entityAccess: [],
    isActive: true,
    lastLoginAt: '2025-01-13T08:30:00Z',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'user-manager',
    tenantId: 'tenant-acme',
    email: 'manager@acme.com',
    name: 'James Wilson',
    role: 'finance_manager',
    entityAccess: ['entity-us', 'entity-uk'],
    isActive: true,
    lastLoginAt: '2025-01-12T14:15:00Z',
    createdAt: '2023-02-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'user-accountant',
    tenantId: 'tenant-acme',
    email: 'accountant@acme.com',
    name: 'Maria Rodriguez',
    role: 'accountant',
    entityAccess: ['entity-us'],
    isActive: true,
    lastLoginAt: '2025-01-13T09:00:00Z',
    createdAt: '2023-04-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'user-ap-clerk',
    tenantId: 'tenant-acme',
    email: 'ap@acme.com',
    name: 'David Kim',
    role: 'ap_clerk',
    entityAccess: ['entity-us'],
    isActive: true,
    lastLoginAt: '2025-01-10T10:30:00Z',
    createdAt: '2023-05-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
]

// ─── Auth state ───────────────────────────────────────────────────────────────

let _currentUser: User = MOCK_USERS[0]
let _currentEntity: Entity = MOCK_ENTITIES[0]

// ─── AuthService ──────────────────────────────────────────────────────────────

export class AuthService {
  static getCurrentUser(): User {
    return _currentUser
  }

  static getCurrentTenant(): Tenant {
    return MOCK_TENANT
  }

  static getCurrentEntity(): Entity {
    return _currentEntity
  }

  static setCurrentEntity(entityId: string): void {
    const entity = MOCK_ENTITIES.find((e) => e.id === entityId)
    if (!entity) throw new Error(`Entity ${entityId} not found`)
    _currentEntity = entity
  }

  static getServiceContext(periodId?: string): ServiceContext {
    return {
      tenantId: _currentUser.tenantId,
      entityId: _currentEntity.id,
      userId: _currentUser.id,
      userRole: _currentUser.role,
      periodId,
    }
  }

  static getEntitiesForUser(userId: string): Entity[] {
    const user = MOCK_USERS.find((u) => u.id === userId)
    if (!user) return []
    if (user.entityAccess.length === 0) return MOCK_ENTITIES.filter((e) => e.tenantId === user.tenantId)
    return MOCK_ENTITIES.filter((e) => user.entityAccess.includes(e.id))
  }

  static async login(email: string, _password: string): Promise<User> {
    const user = MOCK_USERS.find((u) => u.email === email)
    if (!user) throw new Error('Invalid credentials')
    _currentUser = user
    return user
  }

  static async logout(): Promise<void> {
    // In production, clear Supabase session
    _currentUser = MOCK_USERS[0]
  }
}
