// ─── Tenant ───────────────────────────────────────────────────────────────────

export type TenantPlan = 'starter' | 'professional' | 'enterprise'

export interface TenantSettings {
  defaultCurrency: string
  fiscalYearStartMonth: number // 1-12
  enableMultiEntity: boolean
  enableAIAssist: boolean
  requireDualApproval: boolean
  enforceSegregationOfDuties: boolean
  allowPeriodUnlock: boolean
  maxApprovalLayers: number
}

export interface Tenant {
  id: string
  name: string
  slug: string
  plan: TenantPlan
  settings: TenantSettings
  createdAt: string
  updatedAt: string
}

// ─── Entity ───────────────────────────────────────────────────────────────────

export interface Entity {
  id: string
  tenantId: string
  name: string
  legalName: string
  currency: string // ISO 4217
  countryCode: string // ISO 3166-1 alpha-2
  parentEntityId: string | null // null = root entity
  fiscalYearEnd: string // MM-DD e.g. "12-31"
  taxId: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ─── Currency ─────────────────────────────────────────────────────────────────

export interface Currency {
  code: string // ISO 4217
  name: string
  symbol: string
  decimals: number
}

export const CURRENCIES: Record<string, Currency> = {
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2 },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2 },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', decimals: 2 },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimals: 0 },
  CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', decimals: 2 },
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimals: 2 },
  CHF: { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', decimals: 2 },
  CNY: { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimals: 2 },
  SGD: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimals: 2 },
  HKD: { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', decimals: 2 },
}

// ─── Accounting Period ────────────────────────────────────────────────────────

export type PeriodStatus = 'open' | 'closed' | 'locked'

export interface AccountingPeriod {
  id: string
  tenantId: string
  entityId: string
  year: number
  month: number // 1-12
  status: PeriodStatus
  openedAt: string
  closedAt: string | null
  closedBy: string | null
  lockedAt: string | null
  lockedBy: string | null
}

// ─── Chart of Accounts ────────────────────────────────────────────────────────

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
export type NormalBalance = 'debit' | 'credit'

export interface ChartOfAccount {
  id: string
  tenantId: string
  entityId: string
  code: string
  name: string
  type: AccountType
  normalBalance: NormalBalance
  currency: string
  isControl: boolean
  isActive: boolean
  parentAccountId: string | null
  description: string | null
  createdAt: string
  updatedAt: string
}

// ─── Vendor ───────────────────────────────────────────────────────────────────

export type VendorStatus = 'active' | 'inactive' | 'blocked'

export interface Vendor {
  id: string
  tenantId: string
  entityId: string
  name: string
  legalName: string | null
  taxId: string | null
  currency: string
  paymentTerms: number // days
  bankAccount: string | null
  bankRoutingNumber: string | null
  status: VendorStatus
  address: VendorAddress | null
  createdAt: string
  updatedAt: string
}

export interface VendorAddress {
  street: string
  city: string
  state: string | null
  postalCode: string
  countryCode: string
}

// ─── Customer ─────────────────────────────────────────────────────────────────

export type CustomerStatus = 'active' | 'inactive' | 'credit_hold'

export interface Customer {
  id: string
  tenantId: string
  entityId: string
  name: string
  legalName: string | null
  taxId: string | null
  currency: string
  paymentTerms: number // days
  creditLimit: number
  outstandingBalance: number
  status: CustomerStatus
  address: CustomerAddress | null
  createdAt: string
  updatedAt: string
}

export interface CustomerAddress {
  street: string
  city: string
  state: string | null
  postalCode: string
  countryCode: string
}

// ─── User ─────────────────────────────────────────────────────────────────────

export type UserRole =
  | 'super_admin'
  | 'tenant_admin'
  | 'finance_controller'
  | 'finance_manager'
  | 'accountant'
  | 'ap_clerk'
  | 'ar_clerk'
  | 'auditor'
  | 'read_only'

export interface User {
  id: string
  tenantId: string
  email: string
  name: string
  role: UserRole
  entityAccess: string[] // entity IDs the user can access; empty = all
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

// ─── Service Context ──────────────────────────────────────────────────────────

export interface ServiceContext {
  tenantId: string
  entityId: string
  userId: string
  periodId?: string
  userRole: UserRole
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatAmount(amount: number, currencyCode: string): string {
  const currency = CURRENCIES[currencyCode]
  const decimals = currency?.decimals ?? 2
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
}

export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = CURRENCIES[currencyCode]
  if (!currency) return `${currencyCode} ${amount.toFixed(2)}`
  return `${currency.symbol}${formatAmount(amount, currencyCode)}`
}
