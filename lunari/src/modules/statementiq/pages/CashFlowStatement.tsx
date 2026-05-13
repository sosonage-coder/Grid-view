import { useStatements } from '../hooks/useStatements'
import { AuthService } from '../../../platform/services/auth.service'
import { formatCurrency } from '../../../platform/types/core'
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card'
import clsx from 'clsx'

const CURRENT_PERIOD = 'period-2025-01'

export function CashFlowStatement() {
  const entity = AuthService.getCurrentEntity()
  const { cashFlow: data, loading } = useStatements({ periodId: CURRENT_PERIOD, entityId: entity.id })

  if (loading || !data) return <div className="text-slate-500 text-sm">Loading...</div>

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Cash Flow Statement</h1>
        <p className="text-sm text-slate-400 mt-0.5">{data.entityName} · {data.periodLabel}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Operating', value: data.operatingActivities, color: 'text-green-400' },
          { label: 'Investing', value: data.investingActivities, color: data.investingActivities >= 0 ? 'text-blue-400' : 'text-red-400' },
          { label: 'Financing', value: data.financingActivities, color: data.financingActivities >= 0 ? 'text-blue-400' : 'text-red-400' },
        ].map((s) => (
          <Card key={s.label} className="text-center">
            <p className="text-xs text-slate-500 uppercase">{s.label}</p>
            <p className={`font-mono font-bold text-lg mt-1 ${s.color}`}>
              {data.operatingActivities >= 0 ? '+' : ''}{formatCurrency(s.value, data.currency)}
            </p>
          </Card>
        ))}
      </div>

      <Card padding="none">
        <CardHeader className="px-4 pt-4 pb-3 border-b border-slate-700"><CardTitle>{data.title}</CardTitle></CardHeader>
        <div className="px-2 py-2">
          {data.sections.map((section) => (
            <div key={section.title} className="mb-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3 py-1">{section.title}</p>
              {section.lines.map((line, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 text-sm border-b border-slate-700/30 px-3" style={{ paddingLeft: `${(line.indent + 1) * 12 + 12}px` }}>
                  <span className="text-slate-400">{line.label}</span>
                  <span className={clsx('font-mono', line.amount >= 0 ? 'text-slate-300' : 'text-red-400')}>
                    {line.amount >= 0 ? '' : ''}{formatCurrency(line.amount, data.currency)}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between px-3 py-1.5 font-semibold text-sm border-t border-slate-600">
                <span className="text-slate-200">Net cash from {section.title.toLowerCase()}</span>
                <span className={clsx('font-mono', section.subtotal >= 0 ? 'text-green-400' : 'text-red-400')}>
                  {formatCurrency(section.subtotal, data.currency)}
                </span>
              </div>
            </div>
          ))}

          <div className="border-t-2 border-slate-600 px-3 mt-2">
            {[
              { label: 'Net change in cash', value: data.netChangeInCash },
              { label: 'Beginning cash', value: data.beginningCash },
              { label: 'Ending cash', value: data.endingCash },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-1.5 text-sm">
                <span className={label === 'Ending cash' ? 'font-bold text-slate-100' : 'text-slate-400'}>{label}</span>
                <span className={clsx('font-mono', label === 'Ending cash' ? 'font-bold text-slate-100' : value >= 0 ? 'text-green-400' : 'text-red-400')}>
                  {formatCurrency(value, data.currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
