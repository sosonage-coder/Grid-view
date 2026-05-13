import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText, Receipt, Banknote, Calendar, TrendingUp, Home, Database, Shield,
  BarChart2, FileSearch, Clock, AlertTriangle, CheckCircle, Sparkles, ArrowRight,
  RefreshCw,
} from 'lucide-react'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { PayIQService } from '../modules/payiq/payiq.service'
import { ReceivableIQService } from '../modules/receivableiq/receivableiq.service'
import { CashIQService } from '../modules/cashiq/cashiq.service'
import { CloseIQService } from '../modules/closeiq/closeiq.service'
import { AuthService } from '../platform/services/auth.service'
import { AIService } from '../ai/ai.service'
import { formatCurrency } from '../platform/types/core'
import type { CloseBlockerSummary } from '../ai/types'

interface DashStats {
  apPendingCount: number
  apOverdueAmount: number
  arOverdueAmount: number
  cashBalance: number
  closeCompletionPct: number
  closeCriticalBlockers: number
}

const MODULE_CARDS = [
  { label: 'PayIQ', sublabel: 'Accounts Payable', icon: <FileText className="h-5 w-5" />, color: 'text-orange-400', to: '/payiq/invoices' },
  { label: 'ReceivableIQ', sublabel: 'Accounts Receivable', icon: <Receipt className="h-5 w-5" />, color: 'text-teal-400', to: '/receivableiq/invoices' },
  { label: 'CashIQ', sublabel: 'Cash & Bank', icon: <Banknote className="h-5 w-5" />, color: 'text-green-400', to: '/cashiq/position' },
  { label: 'CloseIQ', sublabel: 'Month-End Close', icon: <Calendar className="h-5 w-5" />, color: 'text-blue-400', to: '/closeiq/checklist' },
  { label: 'ReconcileIQ', sublabel: 'Balance Sheet Recon', icon: <RefreshCw className="h-5 w-5" />, color: 'text-purple-400', to: '/reconcileiq' },
  { label: 'ScheduleIQ', sublabel: 'Prepaids & Accruals', icon: <Clock className="h-5 w-5" />, color: 'text-yellow-400', to: '/scheduleiq/prepaids' },
  { label: 'RevenueIQ', sublabel: 'ASC 606 Revenue', icon: <TrendingUp className="h-5 w-5" />, color: 'text-pink-400', to: '/revenueiq/contracts' },
  { label: 'LeaseIQ', sublabel: 'IFRS 16 / ASC 842', icon: <Home className="h-5 w-5" />, color: 'text-indigo-400', to: '/leaseiq/leases' },
  { label: 'AssetIQ', sublabel: 'Fixed Assets', icon: <Database className="h-5 w-5" />, color: 'text-cyan-400', to: '/assetiq/register' },
  { label: 'ComplianceHub', sublabel: 'Controls & Obligations', icon: <Shield className="h-5 w-5" />, color: 'text-red-400', to: '/compliancehub/controls' },
  { label: 'StatementIQ', sublabel: 'Financial Statements', icon: <BarChart2 className="h-5 w-5" />, color: 'text-slate-300', to: '/statementiq/income' },
  { label: 'AuditIQ', sublabel: 'PBC & Evidence', icon: <FileSearch className="h-5 w-5" />, color: 'text-amber-400', to: '/auditiq/pbc' },
]

export function Dashboard() {
  const [stats, setStats] = useState<DashStats | null>(null)
  const [aiSummary, setAiSummary] = useState<CloseBlockerSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const ctx = AuthService.getServiceContext()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [invoices, arInvoices, cashPos, checklist, ai] = await Promise.all([
        PayIQService.getInvoices(ctx, {}),
        ReceivableIQService.getInvoices(ctx, {}),
        CashIQService.getCashPosition(ctx),
        CloseIQService.getChecklist(ctx, 'period-2025-01'),
        AIService.summarizeCloseBlockers(ctx, 'period-2025-01'),
      ])
      const today = new Date().toISOString().slice(0, 10)
      const apPendingCount = invoices.filter((i) => i.status === 'pending_approval').length
      const apOverdueAmount = invoices.filter((i) => i.dueDate < today && !['paid', 'void'].includes(i.status)).reduce((s, i) => s + i.outstandingAmount, 0)
      const arOverdueAmount = arInvoices.filter((i) => i.dueDate < today && !['paid', 'void', 'written_off'].includes(i.status)).reduce((s, i) => s + i.outstandingAmount, 0)
      setStats({
        apPendingCount,
        apOverdueAmount,
        arOverdueAmount,
        cashBalance: cashPos.totalBalance,
        closeCompletionPct: checklist?.completionPct ?? 0,
        closeCriticalBlockers: ai.criticalBlockers,
      })
      setAiSummary(ai)
      setLoading(false)
    }
    void load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Finance Command Center</h1>
        <p className="text-sm text-slate-400 mt-1">Acme US — Jan 2025</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Cash Balance', value: stats ? formatCurrency(stats.cashBalance, 'USD') : '—', sub: 'All accounts', color: 'text-green-400', icon: <Banknote className="h-4 w-4" /> },
          { label: 'AP Pending', value: stats?.apPendingCount ?? '—', sub: 'Invoices awaiting approval', color: 'text-amber-400', icon: <FileText className="h-4 w-4" /> },
          { label: 'AR Overdue', value: stats ? formatCurrency(stats.arOverdueAmount, 'USD') : '—', sub: 'Past due receivables', color: 'text-red-400', icon: <Receipt className="h-4 w-4" /> },
          { label: 'Close Progress', value: stats ? `${stats.closeCompletionPct}%` : '—', sub: stats?.closeCriticalBlockers ? `${stats.closeCriticalBlockers} critical blockers` : 'Jan 2025', color: stats?.closeCriticalBlockers ? 'text-red-400' : 'text-blue-400', icon: <Calendar className="h-4 w-4" /> },
        ].map((kpi) => (
          <Card key={kpi.label} className="flex items-start gap-3">
            <div className={`mt-0.5 ${kpi.color}`}>{kpi.icon}</div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 uppercase tracking-wide">{kpi.label}</p>
              <p className={`text-xl font-bold font-mono ${kpi.color} leading-none mt-1`}>
                {loading ? <span className="h-6 w-20 bg-slate-700 rounded animate-pulse block" /> : kpi.value}
              </p>
              <p className="text-xs text-slate-500 mt-1">{kpi.sub}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Module grid */}
        <div className="xl:col-span-2">
          <Card padding="none">
            <CardHeader className="px-4 pt-4 pb-3 mb-0">
              <CardTitle>Modules</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-slate-700/50">
              {MODULE_CARDS.map((m) => (
                <Link
                  key={m.label}
                  to={m.to}
                  className="bg-slate-800 hover:bg-slate-750 p-4 group transition-colors"
                >
                  <div className={`${m.color} mb-2`}>{m.icon}</div>
                  <p className="text-sm font-medium text-slate-200 group-hover:text-white">{m.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{m.sublabel}</p>
                </Link>
              ))}
            </div>
          </Card>
        </div>

        {/* AI Insights */}
        <div className="space-y-4">
          {/* AI Close Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-400" />
                <CardTitle>AI Close Insights</CardTitle>
              </div>
              <Badge variant="primary" size="sm">Jan 2025</Badge>
            </CardHeader>

            {loading ? (
              <div className="space-y-2">
                {[1,2,3].map((i) => <div key={i} className="h-8 bg-slate-700 rounded animate-pulse" />)}
              </div>
            ) : aiSummary ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-400 leading-relaxed">{aiSummary.aiSummary}</p>
                <div className="space-y-2">
                  {aiSummary.blockers.slice(0, 4).map((b) => (
                    <div key={b.description} className="flex items-start gap-2 text-xs">
                      {b.isCritical ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className={b.isCritical ? 'text-red-300' : 'text-amber-300'}>{b.description}</p>
                        <p className="text-slate-500">{b.suggestedAction}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-slate-700">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Close progress</span>
                    <span>{stats?.closeCompletionPct ?? 0}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${stats?.closeCompletionPct ?? 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </Card>

          {/* AP Aging Summary */}
          <Card>
            <CardHeader>
              <CardTitle>AP Aging</CardTitle>
              <Link to="/payiq/invoices" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            {[
              { label: 'Current', amount: 47000, color: 'bg-green-500' },
              { label: '1–30 days', amount: 48600, color: 'bg-amber-500' },
              { label: '31–60 days', amount: 22000, color: 'bg-orange-500' },
              { label: '60+ days', amount: 0, color: 'bg-red-500' },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-1 text-xs border-b border-slate-700/50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${row.color}`} />
                  <span className="text-slate-400">{row.label}</span>
                </div>
                <span className="font-mono text-slate-300">{formatCurrency(row.amount, 'USD')}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  )
}
