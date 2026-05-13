import { useStatements } from '../hooks/useStatements'
import { AuthService } from '../../../platform/services/auth.service'
import { formatCurrency } from '../../../platform/types/core'
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card'
import clsx from 'clsx'
import type { StatementLine } from '../types'

const CURRENT_PERIOD = 'period-2025-01'

function StatementRow({ line, currency }: { line: StatementLine; currency: string }) {
  return (
    <div
      className={clsx(
        'flex items-center justify-between py-1.5 text-sm border-b border-slate-700/30 last:border-0',
        line.isTotal && 'border-t border-slate-600 font-bold bg-slate-900/30',
        line.isSubtotal && 'font-semibold',
      )}
      style={{ paddingLeft: `${(line.indent + 1) * 12}px` }}
    >
      <span className={clsx(line.isTotal ? 'text-slate-100' : line.isSubtotal ? 'text-slate-200' : 'text-slate-400')}>
        {line.label}
      </span>
      <div className="flex gap-8">
        <span className={clsx('font-mono text-right w-28', line.isTotal ? 'text-slate-100' : 'text-slate-300')}>
          {formatCurrency(line.amount, currency)}
        </span>
        {line.priorAmount != null && (
          <span className="font-mono text-right w-28 text-slate-500">{formatCurrency(line.priorAmount, currency)}</span>
        )}
        {line.variancePct != null && (
          <span className={clsx('font-mono text-right w-16 text-xs', line.variancePct >= 0 ? 'text-green-400' : 'text-red-400')}>
            {line.variancePct >= 0 ? '+' : ''}{line.variancePct.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  )
}

export function IncomeStatement() {
  const entity = AuthService.getCurrentEntity()
  const { incomeStatement: data, loading } = useStatements({ periodId: CURRENT_PERIOD, entityId: entity.id })

  if (loading || !data) return <div className="text-slate-500 text-sm">Loading statement...</div>

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Income Statement</h1>
          <p className="text-sm text-slate-400 mt-0.5">{data.entityName} · {data.periodLabel}</p>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Revenue', value: data.revenue, color: 'text-green-400' },
          { label: 'Gross Profit', value: data.grossProfit, sub: `${data.grossMargin.toFixed(1)}% margin`, color: 'text-teal-400' },
          { label: 'Operating Income', value: data.operatingIncome, color: 'text-blue-400' },
          { label: 'Net Income', value: data.netIncome, color: data.netIncome >= 0 ? 'text-green-400' : 'text-red-400' },
        ].map((kpi) => (
          <Card key={kpi.label} className="text-center">
            <p className="text-xs text-slate-500 uppercase">{kpi.label}</p>
            <p className={`font-mono font-bold text-base mt-1 ${kpi.color}`}>{formatCurrency(kpi.value, data.currency)}</p>
            {kpi.sub && <p className="text-xs text-slate-500 mt-0.5">{kpi.sub}</p>}
          </Card>
        ))}
      </div>

      <Card padding="none">
        <CardHeader className="px-4 pt-4 pb-3 border-b border-slate-700">
          <CardTitle>{data.title}</CardTitle>
          <div className="flex gap-8 text-xs text-slate-500">
            <span className="w-28 text-right">Current</span>
            <span className="w-28 text-right">Prior</span>
            <span className="w-16 text-right">Var %</span>
          </div>
        </CardHeader>

        <div className="px-2 py-2">
          {data.sections.map((section) => (
            <div key={section.title} className="mb-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3 py-1">{section.title}</p>
              {section.lines.map((line, i) => (
                <StatementRow key={i} line={line} currency={data.currency} />
              ))}
            </div>
          ))}

          <div className="border-t-2 border-slate-600 pt-2 mt-2">
            <div className="flex items-center justify-between px-3 py-2 font-bold text-sm">
              <span className="text-slate-100">Net Income</span>
              <div className="flex gap-8">
                <span className={`font-mono w-28 text-right ${data.netIncome >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(data.netIncome, data.currency)}</span>
                <span className="font-mono w-28 text-right text-slate-500">{formatCurrency(data.netIncome, data.currency)}</span>
                <span className="w-16" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
