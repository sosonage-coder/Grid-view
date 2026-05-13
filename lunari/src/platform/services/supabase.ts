import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Tenant, Entity, User, AccountingPeriod, ChartOfAccount, Vendor, Customer } from '../types/core'
import type { Journal, GLBalance, FXRate } from '../types/ledger'
import type { AuditEvent } from '../types/audit'

// ─── Database type map ────────────────────────────────────────────────────────
// These mirror the Postgres schema defined in db/schema.sql

export interface Database {
  public: {
    Tables: {
      tenants: { Row: Tenant; Insert: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>; Update: Partial<Omit<Tenant, 'id'>> }
      entities: { Row: Entity; Insert: Omit<Entity, 'id' | 'createdAt' | 'updatedAt'>; Update: Partial<Omit<Entity, 'id'>> }
      users: { Row: User; Insert: Omit<User, 'id' | 'createdAt' | 'updatedAt'>; Update: Partial<Omit<User, 'id'>> }
      gl_periods: { Row: AccountingPeriod; Insert: Omit<AccountingPeriod, 'id'>; Update: Partial<Omit<AccountingPeriod, 'id'>> }
      gl_accounts: { Row: ChartOfAccount; Insert: Omit<ChartOfAccount, 'id' | 'createdAt' | 'updatedAt'>; Update: Partial<Omit<ChartOfAccount, 'id'>> }
      gl_journals: { Row: Omit<Journal, 'lines' | 'attachments'>; Insert: Omit<Journal, 'id' | 'lines' | 'attachments'>; Update: Partial<Omit<Journal, 'id'>> }
      gl_balances: { Row: GLBalance; Insert: Omit<GLBalance, 'id'>; Update: Partial<Omit<GLBalance, 'id'>> }
      fx_rates: { Row: FXRate; Insert: Omit<FXRate, 'id' | 'createdAt'>; Update: Partial<FXRate> }
      audit_log: { Row: AuditEvent; Insert: Omit<AuditEvent, 'id' | 'createdAt'>; Update: never }
      vendors: { Row: Vendor; Insert: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>; Update: Partial<Omit<Vendor, 'id'>> }
      customers: { Row: Customer; Insert: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>; Update: Partial<Omit<Customer, 'id'>> }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// ─── Client factory ───────────────────────────────────────────────────────────

let _client: SupabaseClient<Database> | null = null

export function getSupabaseClient(): SupabaseClient<Database> {
  if (!_client) {
    const url = import.meta.env.VITE_SUPABASE_URL ?? 'https://placeholder.supabase.co'
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'placeholder-key'
    _client = createClient<Database>(url, key)
  }
  return _client
}

// ─── Typed query helpers ──────────────────────────────────────────────────────

export async function dbSelect<T>(
  table: string,
  filters: Record<string, unknown> = {},
): Promise<T[]> {
  // In dev mode with mock data, this is bypassed by the service layer
  const client = getSupabaseClient()
  let query = client.from(table).select('*')
  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value)
  }
  const { data, error } = await query
  if (error) throw new Error(`DB select error on ${table}: ${error.message}`)
  return (data ?? []) as T[]
}

export async function dbInsert<T>(table: string, row: unknown): Promise<T> {
  const client = getSupabaseClient()
  const { data, error } = await client.from(table).insert(row as never).select().single()
  if (error) throw new Error(`DB insert error on ${table}: ${error.message}`)
  return data as T
}

export async function dbUpdate<T>(table: string, id: string, patch: unknown): Promise<T> {
  const client = getSupabaseClient()
  const { data, error } = await client.from(table).update(patch as never).eq('id', id).select().single()
  if (error) throw new Error(`DB update error on ${table}: ${error.message}`)
  return data as T
}
