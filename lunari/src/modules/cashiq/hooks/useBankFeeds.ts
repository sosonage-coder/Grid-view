import { useState, useEffect, useCallback } from 'react'
import type { BankAccount, BankTransaction, CashPosition } from '../types'
import { CashIQService } from '../cashiq.service'
import { AuthService } from '../../../platform/services/auth.service'

export function useBankFeeds(bankAccountId?: string) {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [transactions, setTransactions] = useState<BankTransaction[]>([])
  const [position, setPosition] = useState<CashPosition | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const ctx = AuthService.getServiceContext()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [accs, txns, pos] = await Promise.all([
        CashIQService.getBankAccounts(ctx),
        CashIQService.getTransactions(ctx, bankAccountId),
        CashIQService.getCashPosition(ctx),
      ])
      setAccounts(accs)
      setTransactions(txns)
      setPosition(pos)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load bank data')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.tenantId, ctx.entityId, bankAccountId])

  useEffect(() => { void load() }, [load])

  return { accounts, transactions, position, loading, error, reload: load }
}
