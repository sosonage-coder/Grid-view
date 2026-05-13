import type { ServiceContext } from '../../platform/types/core'
import { generateId } from '../../engine/ledger.engine'
import type { BankAccount, BankTransaction, BankReconciliation, CashPosition } from './types'

const _accounts: Map<string, BankAccount> = new Map()
const _transactions: Map<string, BankTransaction> = new Map()
const _reconciliations: Map<string, BankReconciliation> = new Map()

;(function seed() {
  const accounts: BankAccount[] = [
    { id: 'bank-001', tenantId: 'tenant-acme', entityId: 'entity-us', name: 'Operating Checking', bankName: 'First National Bank', accountNumber: '...4521', routingNumber: '021000021', accountType: 'checking', currency: 'USD', glAccountId: 'acc-1010', glAccountCode: '1010', currentBalance: 2847500, availableBalance: 2847500, lastReconciledDate: '2024-11-30', isActive: true, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2025-01-13T00:00:00Z' },
    { id: 'bank-002', tenantId: 'tenant-acme', entityId: 'entity-us', name: 'Payroll Account', bankName: 'First National Bank', accountNumber: '...8834', routingNumber: '021000021', accountType: 'checking', currency: 'USD', glAccountId: 'acc-1011', glAccountCode: '1011', currentBalance: 450000, availableBalance: 450000, lastReconciledDate: '2024-11-30', isActive: true, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2025-01-13T00:00:00Z' },
    { id: 'bank-003', tenantId: 'tenant-acme', entityId: 'entity-us', name: 'Money Market Reserve', bankName: 'Capital Trust', accountNumber: '...2210', routingNumber: '026009593', accountType: 'money_market', currency: 'USD', glAccountId: 'acc-1012', glAccountCode: '1012', currentBalance: 5000000, availableBalance: 5000000, lastReconciledDate: '2024-11-30', isActive: true, createdAt: '2023-06-01T00:00:00Z', updatedAt: '2025-01-13T00:00:00Z' },
    { id: 'bank-004', tenantId: 'tenant-acme', entityId: 'entity-us', name: 'Credit Line', bankName: 'Capital Trust', accountNumber: '...9901', routingNumber: '026009593', accountType: 'credit_line', currency: 'USD', glAccountId: 'acc-2020', glAccountCode: '2020', currentBalance: -150000, availableBalance: 1850000, lastReconciledDate: '2024-11-30', isActive: true, createdAt: '2023-09-01T00:00:00Z', updatedAt: '2025-01-13T00:00:00Z' },
  ]
  for (const a of accounts) _accounts.set(a.id, a)

  const txBase = [
    { bankAccountId: 'bank-001', type: 'debit' as const, amount: 48600, description: 'TechParts Inc. — TP-2024-8821', reference: 'ACH-20241220', transactionDate: '2024-12-20', valueDate: '2024-12-20' },
    { bankAccountId: 'bank-001', type: 'credit' as const, amount: 75000, description: 'Globex Industries — INV-2024-0441', reference: 'WIRE-20241218', transactionDate: '2024-12-18', valueDate: '2024-12-18' },
    { bankAccountId: 'bank-001', type: 'debit' as const, amount: 12500, description: 'CloudHost Corp — CH-INV-00442', reference: 'ACH-20241215', transactionDate: '2024-12-15', valueDate: '2024-12-15' },
    { bankAccountId: 'bank-001', type: 'credit' as const, amount: 32000, description: 'Springfield Corp — INV-2024-0442', reference: 'ACH-20241216', transactionDate: '2024-12-16', valueDate: '2024-12-16' },
    { bankAccountId: 'bank-001', type: 'debit' as const, amount: 35000, description: 'Marketing Agency Co — MAC-2024-441', reference: 'ACH-20241222', transactionDate: '2024-12-22', valueDate: '2024-12-22' },
    { bankAccountId: 'bank-001', type: 'debit' as const, amount: 3456, description: 'Office Supplies Ltd — OSL-9901', reference: 'ACH-20241205', transactionDate: '2024-12-05', valueDate: '2024-12-05' },
  ]
  let balance = 2847500
  for (const tx of txBase) {
    balance += tx.type === 'credit' ? tx.amount : -tx.amount
    const t: BankTransaction = {
      id: generateId(), tenantId: 'tenant-acme', entityId: 'entity-us',
      ...tx, currency: 'USD', balance, status: 'unreconciled',
      matchedJournalLineId: null, importedAt: new Date().toISOString(),
    }
    _transactions.set(t.id, t)
  }
})()

export class CashIQService {
  static async getBankAccounts(ctx: ServiceContext): Promise<BankAccount[]> {
    return Array.from(_accounts.values()).filter((a) => a.tenantId === ctx.tenantId && a.entityId === ctx.entityId && a.isActive)
  }

  static async getCashPosition(ctx: ServiceContext): Promise<CashPosition> {
    const accounts = await this.getBankAccounts(ctx)
    return {
      entityId: ctx.entityId,
      entityName: ctx.entityId,
      currency: 'USD',
      accounts,
      totalBalance: accounts.reduce((s, a) => s + a.currentBalance, 0),
      totalAvailable: accounts.reduce((s, a) => s + a.availableBalance, 0),
      asOfDate: new Date().toISOString(),
    }
  }

  static async getTransactions(ctx: ServiceContext, bankAccountId?: string): Promise<BankTransaction[]> {
    let txns = Array.from(_transactions.values()).filter((t) => t.tenantId === ctx.tenantId && t.entityId === ctx.entityId)
    if (bankAccountId) txns = txns.filter((t) => t.bankAccountId === bankAccountId)
    return txns.sort((a, b) => b.transactionDate.localeCompare(a.transactionDate))
  }

  static async getReconciliations(ctx: ServiceContext): Promise<BankReconciliation[]> {
    return Array.from(_reconciliations.values()).filter((r) => r.tenantId === ctx.tenantId && r.entityId === ctx.entityId)
  }

  static async createReconciliation(ctx: ServiceContext, data: Pick<BankReconciliation, 'bankAccountId' | 'periodId' | 'statementDate' | 'statementBalance'>): Promise<BankReconciliation> {
    const account = _accounts.get(data.bankAccountId)
    const glBalance = account?.currentBalance ?? 0
    const recon: BankReconciliation = {
      id: generateId(), tenantId: ctx.tenantId, entityId: ctx.entityId,
      ...data, glBalance, reconciledBalance: glBalance, difference: data.statementBalance - glBalance,
      status: 'in_progress', reconciledBy: ctx.userId, approvedBy: null, approvedAt: null, completedAt: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }
    _reconciliations.set(recon.id, recon)
    return recon
  }
}
