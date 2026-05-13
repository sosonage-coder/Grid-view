import { useStatements } from '../hooks/useStatements'
import { AuthService } from '../../../platform/services/auth.service'
import { formatCurrency } from '../../../platform/types/core'
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import clsx from 'clsx'
import type { StatementLine } from '../types'

const CURRENT_PERIOD = 'period-2025-01'

function BSRow({ line, currency }: { line: StatementLine; currency: string }) {
  return (
    <div
      className={clsx(
        'flex items-center justify-between py-1.5 text-sm border-b border-slate-700/30 last:border-0',
        line.isTotal && 'border-t border-slate-600 font-bold',
        line.isSubtotal && 'font-semibold',
      )}
      style={{ paddingLeft: `${(line.indent + 1) * 12}px` }}
    >
      <span className={clsx(line.isTotal ? 'text-slate-100' : line.isSubtotal ? 'text-slate-200' : 'text-slate-400')}>{line.label}</span>
      <span className={clsx('font-mono text-right', line.isTotal ? 'text-slate-100' : 'text-slate-300')}>{formatCurrency(line.amount, currency)}</span>
    </div>
  )
}

export function BalanceSheet() {
  const entity = AuthService.getCurrentEntity()
  const { balanceSheet: data, loading } = useStatements({ periodId: CURRENT_PERIOD, entityId: entity.id })

  if (loading || !data) return <div className="text-slate-500 text-sm">Loading...</div>

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Balance Sheet</h1>
          <p className="text-sm text-slate-400 mt-0.5">{data.entityName} · {data.periodLabel}</p>
        </div>
        <Badge variant={data.isBalanced ? 'success' : 'danger'}>
          {data.isBalanced ? 'Balanced' : 'DOES NOT BALANCE'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Assets */}
        <Card padding="none">
          <CardHeader className="px-4 pt-4 pb-3 border-b border-slate-700">
            <CardTitle>Assets</CardTitle>
            <span className="font-mono font-bold text-slate-100">{formatCurrency(data.totalAssets, data.currency)}</span>
          </CardHeader>
          <div className="px-2 py-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3 py-1">Current Assets</p>
            {data.sections[0]?.lines.map((l, i) => <BSRow key={i} line={l} currency={data.currency} />)}
            <div className="px-3 py-1.5 flex justify-between font-semibold text-sm border-t border-slate-700 mt-1">
              <span className="text-slate-200">Total Current Assets</span>
              <span className="font-mono">{formatCurrency(data.totalCurrentAssets, data.currency)}</span>
            </div>

            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3 py-1 mt-3">Non-Current Assets</p>
            {data.sections[1]?.lines.map((l, i) => <BSRow key={i} line={l} currency={data.currency} />)}
            <div className="px-3 py-1.5 flex justify-between font-semibold text-sm border-t border-slate-700 mt-1">
              <span className="text-slate-200">Total Non-Current Assets</span>
              <span className="font-mono">{formatCurrency(data.totalNonCurrentAssets, data.currency)}</span>
            </div>

            <div className="px-3 py-2 flex justify-between font-bold text-sm border-t-2 border-slate-600 mt-1 bg-slate-900/30">
              <span className="text-slate-100">TOTAL ASSETS</span>
              <span className="font-mono text-slate-100">{formatCurrency(data.totalAssets, data.currency)}</span>
            </div>
          </div>
        </Card>

        {/* Liabilities & Equity */}
        <Card padding="none">
          <CardHeader className="px-4 pt-4 pb-3 border-b border-slate-700">
            <CardTitle>Liabilities & Equity</CardTitle>
            <span className="font-mono font-bold text-slate-100">{formatCurrency(data.totalLiabilitiesAndEquity, data.currency)}</span>
          </CardHeader>
          <div className="px-2 py-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3 py-1">Current Liabilities</p>
            {data.sections[2]?.lines.map((l, i) => <BSRow key={i} line={l} currency={data.currency} />)}
            <div className="px-3 py-1.5 flex justify-between font-semibold text-sm border-t border-slate-700 mt-1">
              <span className="text-slate-200">Total Current Liabilities</span>
              <span className="font-mono">{formatCurrency(data.totalCurrentLiabilities, data.currency)}</span>
            </div>

            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3 py-1 mt-3">Non-Current Liabilities</p>
            {data.sections[3]?.lines.map((l, i) => <BSRow key={i} line={l} currency={data.currency} />)}
            <div className="px-3 py-1.5 flex justify-between font-semibold text-sm border-t border-slate-700 mt-1">
              <span className="text-slate-200">Total Non-Current Liabilities</span>
              <span className="font-mono">{formatCurrency(data.totalNonCurrentLiabilities, data.currency)}</span>
            </div>

            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3 py-1 mt-3">Equity</p>
            {data.sections[4]?.lines.map((l, i) => <BSRow key={i} line={l} currency={data.currency} />)}
            <div className="px-3 py-1.5 flex justify-between font-semibold text-sm border-t border-slate-700 mt-1">
              <span className="text-slate-200">Total Equity</span>
              <span className="font-mono">{formatCurrency(data.totalEquity, data.currency)}</span>
            </div>

            <div className="px-3 py-2 flex justify-between font-bold text-sm border-t-2 border-slate-600 mt-1 bg-slate-900/30">
              <span className="text-slate-100">TOTAL LIABILITIES & EQUITY</span>
              <span className="font-mono text-slate-100">{formatCurrency(data.totalLiabilitiesAndEquity, data.currency)}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
