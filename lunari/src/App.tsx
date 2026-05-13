import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { Dashboard } from './pages/Dashboard'
import { Login } from './pages/Login'
import { NotFound } from './pages/NotFound'

// PayIQ
import { InvoiceList } from './modules/payiq/pages/InvoiceList'
import { InvoiceDetail } from './modules/payiq/pages/InvoiceDetail'
import { PaymentRun } from './modules/payiq/pages/PaymentRun'

// ReceivableIQ
import { CustomerList } from './modules/receivableiq/pages/CustomerList'
import { ARInvoiceList } from './modules/receivableiq/pages/InvoiceList'
import { ARAgingReport } from './modules/receivableiq/pages/AgingReport'

// CashIQ
import { CashPosition } from './modules/cashiq/pages/CashPosition'
import { BankReconciliation } from './modules/cashiq/pages/BankReconciliation'

// ReconcileIQ
import { ReconciliationList } from './modules/reconcileiq/pages/ReconciliationList'
import { ReconciliationWorksheet } from './modules/reconcileiq/pages/ReconciliationWorksheet'

// CloseIQ
import { CloseChecklist } from './modules/closeiq/pages/CloseChecklist'
import { CloseCalendar } from './modules/closeiq/pages/CloseCalendar'

// ScheduleIQ
import { PrepaidSchedulePage } from './modules/scheduleiq/pages/PrepaidSchedule'
import { AccrualSchedulePage } from './modules/scheduleiq/pages/AccrualSchedule'

// RevenueIQ
import { ContractList } from './modules/revenueiq/pages/ContractList'
import { RevenueSchedule } from './modules/revenueiq/pages/RevenueSchedule'

// LeaseIQ
import { LeaseList } from './modules/leaseiq/pages/LeaseList'
import { LeaseSchedule } from './modules/leaseiq/pages/LeaseSchedule'

// AssetIQ
import { AssetRegister } from './modules/assetiq/pages/AssetRegister'
import { DepreciationSchedule } from './modules/assetiq/pages/DepreciationSchedule'

// ComplianceHub
import { ObligationList } from './modules/compliancehub/pages/ObligationList'
import { ControlMatrix } from './modules/compliancehub/pages/ControlMatrix'

// StatementIQ
import { IncomeStatement } from './modules/statementiq/pages/IncomeStatement'
import { BalanceSheet } from './modules/statementiq/pages/BalanceSheet'
import { CashFlowStatement } from './modules/statementiq/pages/CashFlowStatement'

// AuditIQ
import { PBCList } from './modules/auditiq/pages/PBCList'
import { EvidenceVault } from './modules/auditiq/pages/EvidenceVault'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />

          {/* PayIQ */}
          <Route path="/payiq/invoices" element={<InvoiceList />} />
          <Route path="/payiq/invoices/:id" element={<InvoiceDetail />} />
          <Route path="/payiq/payments" element={<PaymentRun />} />

          {/* ReceivableIQ */}
          <Route path="/receivableiq/customers" element={<CustomerList />} />
          <Route path="/receivableiq/invoices" element={<ARInvoiceList />} />
          <Route path="/receivableiq/aging" element={<ARAgingReport />} />

          {/* CashIQ */}
          <Route path="/cashiq/position" element={<CashPosition />} />
          <Route path="/cashiq/reconciliation" element={<BankReconciliation />} />

          {/* ReconcileIQ */}
          <Route path="/reconcileiq" element={<ReconciliationList />} />
          <Route path="/reconcileiq/:id" element={<ReconciliationWorksheet />} />

          {/* CloseIQ */}
          <Route path="/closeiq/calendar" element={<CloseCalendar />} />
          <Route path="/closeiq/checklist" element={<CloseChecklist />} />

          {/* ScheduleIQ */}
          <Route path="/scheduleiq/prepaids" element={<PrepaidSchedulePage />} />
          <Route path="/scheduleiq/accruals" element={<AccrualSchedulePage />} />

          {/* RevenueIQ */}
          <Route path="/revenueiq/contracts" element={<ContractList />} />
          <Route path="/revenueiq/schedule" element={<RevenueSchedule />} />

          {/* LeaseIQ */}
          <Route path="/leaseiq/leases" element={<LeaseList />} />
          <Route path="/leaseiq/schedule" element={<LeaseSchedule />} />

          {/* AssetIQ */}
          <Route path="/assetiq/register" element={<AssetRegister />} />
          <Route path="/assetiq/depreciation" element={<DepreciationSchedule />} />

          {/* ComplianceHub */}
          <Route path="/compliancehub/obligations" element={<ObligationList />} />
          <Route path="/compliancehub/controls" element={<ControlMatrix />} />

          {/* StatementIQ */}
          <Route path="/statementiq/income" element={<IncomeStatement />} />
          <Route path="/statementiq/balance-sheet" element={<BalanceSheet />} />
          <Route path="/statementiq/cash-flow" element={<CashFlowStatement />} />

          {/* AuditIQ */}
          <Route path="/auditiq/pbc" element={<PBCList />} />
          <Route path="/auditiq/evidence" element={<EvidenceVault />} />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
