import { useState, useEffect, useCallback } from 'react'
import type { IncomeStatementData, BalanceSheetData, CashFlowStatementData, StatementFilters } from '../types'
import { StatementIQService } from '../statementiq.service'
import { AuthService } from '../../../platform/services/auth.service'

export function useStatements(filters: StatementFilters) {
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatementData | null>(null)
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetData | null>(null)
  const [cashFlow, setCashFlow] = useState<CashFlowStatementData | null>(null)
  const [loading, setLoading] = useState(true)
  const ctx = AuthService.getServiceContext()

  const load = useCallback(async () => {
    setLoading(true)
    const [is_, bs, cf] = await Promise.all([
      StatementIQService.getIncomeStatement(ctx, filters),
      StatementIQService.getBalanceSheet(ctx, filters),
      StatementIQService.getCashFlowStatement(ctx, filters),
    ])
    setIncomeStatement(is_)
    setBalanceSheet(bs)
    setCashFlow(cf)
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.periodId, filters.entityId])

  useEffect(() => { void load() }, [load])
  return { incomeStatement, balanceSheet, cashFlow, loading, reload: load }
}
