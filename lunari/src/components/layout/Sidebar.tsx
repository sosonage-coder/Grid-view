import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Receipt, Banknote, RefreshCw, Calendar, Clock, TrendingUp,
  Home, BarChart2, Shield, FileSearch, GitMerge, Database, Sparkles, ChevronDown,
} from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

interface NavItem {
  label: string
  to: string
  icon: React.ReactNode
}

interface NavGroup {
  label: string
  icon: React.ReactNode
  items: NavItem[]
  defaultOpen?: boolean
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Payables',
    icon: <FileText className="h-4 w-4" />,
    defaultOpen: true,
    items: [
      { label: 'Invoices', to: '/payiq/invoices', icon: <FileText className="h-3.5 w-3.5" /> },
      { label: 'Payment Runs', to: '/payiq/payments', icon: <Banknote className="h-3.5 w-3.5" /> },
    ],
  },
  {
    label: 'Receivables',
    icon: <Receipt className="h-4 w-4" />,
    defaultOpen: true,
    items: [
      { label: 'Customer Invoices', to: '/receivableiq/invoices', icon: <Receipt className="h-3.5 w-3.5" /> },
      { label: 'Aging Report', to: '/receivableiq/aging', icon: <BarChart2 className="h-3.5 w-3.5" /> },
    ],
  },
  {
    label: 'Cash',
    icon: <Banknote className="h-4 w-4" />,
    defaultOpen: true,
    items: [
      { label: 'Cash Position', to: '/cashiq/position', icon: <Banknote className="h-3.5 w-3.5" /> },
      { label: 'Bank Reconciliation', to: '/cashiq/reconciliation', icon: <RefreshCw className="h-3.5 w-3.5" /> },
    ],
  },
  {
    label: 'Close & Recon',
    icon: <Calendar className="h-4 w-4" />,
    defaultOpen: true,
    items: [
      { label: 'Close Calendar', to: '/closeiq/calendar', icon: <Calendar className="h-3.5 w-3.5" /> },
      { label: 'Close Checklist', to: '/closeiq/checklist', icon: <Clock className="h-3.5 w-3.5" /> },
      { label: 'Reconciliations', to: '/reconcileiq', icon: <RefreshCw className="h-3.5 w-3.5" /> },
    ],
  },
  {
    label: 'Schedules',
    icon: <GitMerge className="h-4 w-4" />,
    items: [
      { label: 'Prepaids', to: '/scheduleiq/prepaids', icon: <GitMerge className="h-3.5 w-3.5" /> },
      { label: 'Accruals', to: '/scheduleiq/accruals', icon: <Clock className="h-3.5 w-3.5" /> },
    ],
  },
  {
    label: 'Revenue',
    icon: <TrendingUp className="h-4 w-4" />,
    items: [
      { label: 'Contracts', to: '/revenueiq/contracts', icon: <FileText className="h-3.5 w-3.5" /> },
      { label: 'Rev. Schedule', to: '/revenueiq/schedule', icon: <BarChart2 className="h-3.5 w-3.5" /> },
    ],
  },
  {
    label: 'Leases',
    icon: <Home className="h-4 w-4" />,
    items: [
      { label: 'Lease Register', to: '/leaseiq/leases', icon: <Home className="h-3.5 w-3.5" /> },
      { label: 'Lease Schedule', to: '/leaseiq/schedule', icon: <BarChart2 className="h-3.5 w-3.5" /> },
    ],
  },
  {
    label: 'Assets',
    icon: <Database className="h-4 w-4" />,
    items: [
      { label: 'Asset Register', to: '/assetiq/register', icon: <Database className="h-3.5 w-3.5" /> },
      { label: 'Depreciation', to: '/assetiq/depreciation', icon: <BarChart2 className="h-3.5 w-3.5" /> },
    ],
  },
  {
    label: 'Compliance',
    icon: <Shield className="h-4 w-4" />,
    items: [
      { label: 'Obligations', to: '/compliancehub/obligations', icon: <Shield className="h-3.5 w-3.5" /> },
      { label: 'Control Matrix', to: '/compliancehub/controls', icon: <Shield className="h-3.5 w-3.5" /> },
    ],
  },
  {
    label: 'Reporting',
    icon: <BarChart2 className="h-4 w-4" />,
    items: [
      { label: 'Income Statement', to: '/statementiq/income', icon: <TrendingUp className="h-3.5 w-3.5" /> },
      { label: 'Balance Sheet', to: '/statementiq/balance-sheet', icon: <BarChart2 className="h-3.5 w-3.5" /> },
      { label: 'Cash Flow', to: '/statementiq/cash-flow', icon: <Banknote className="h-3.5 w-3.5" /> },
      { label: 'PBC Requests', to: '/auditiq/pbc', icon: <FileSearch className="h-3.5 w-3.5" /> },
      { label: 'Evidence Vault', to: '/auditiq/evidence', icon: <FileSearch className="h-3.5 w-3.5" /> },
    ],
  },
]

function NavGroupItem({ group }: { group: NavGroup }) {
  const [open, setOpen] = useState(group.defaultOpen ?? false)

  return (
    <div>
      <button
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider hover:text-slate-300 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-2">
          <span className="text-slate-500">{group.icon}</span>
          {group.label}
        </div>
        <ChevronDown className={clsx('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="ml-2 mb-1">
          {group.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2.5 px-3 py-1.5 text-sm rounded-md mx-1 transition-colors',
                  isActive
                    ? 'bg-blue-600/20 text-blue-300'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50',
                )
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="w-56 bg-slate-900 border-r border-slate-700/80 flex flex-col flex-shrink-0 h-full">
      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-slate-700/80 flex-shrink-0">
        <div className="h-7 w-7 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-100 leading-none">Lunari</p>
          <p className="text-[10px] text-slate-500 leading-none mt-0.5">Finance OS</p>
        </div>
      </div>

      {/* Dashboard link */}
      <div className="px-2 py-2 border-b border-slate-700/80">
        <NavLink
          to="/"
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors',
              isActive
                ? 'bg-blue-600/20 text-blue-300'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50',
            )
          }
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </NavLink>
      </div>

      {/* Module nav */}
      <nav className="flex-1 overflow-y-auto py-2 space-y-0.5">
        {NAV_GROUPS.map((group) => (
          <NavGroupItem key={group.label} group={group} />
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-slate-700/80">
        <p className="text-[10px] text-slate-600 text-center">Lunari v0.1.0 · AI-Native Finance OS</p>
      </div>
    </aside>
  )
}
