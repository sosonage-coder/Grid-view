export interface StatementLine {
  label: string
  accountIds: string[]
  amount: number
  priorAmount: number | null
  variance: number | null
  variancePct: number | null
  isSubtotal: boolean
  isTotal: boolean
  indent: number
  children?: StatementLine[]
}

export interface FinancialStatement {
  title: string
  entityId: string
  entityName: string
  currency: string
  periodId: string
  periodLabel: string
  priorPeriodId: string | null
  priorPeriodLabel: string | null
  generatedAt: string
  sections: StatementSection[]
}

export interface StatementSection {
  title: string
  lines: StatementLine[]
  subtotal: number
  priorSubtotal: number | null
}

export interface IncomeStatementData extends FinancialStatement {
  revenue: number
  costOfRevenue: number
  grossProfit: number
  grossMargin: number
  operatingExpenses: number
  operatingIncome: number
  otherIncome: number
  interestExpense: number
  incomeBeforeTax: number
  taxExpense: number
  netIncome: number
  ebitda: number
}

export interface BalanceSheetData extends FinancialStatement {
  totalCurrentAssets: number
  totalNonCurrentAssets: number
  totalAssets: number
  totalCurrentLiabilities: number
  totalNonCurrentLiabilities: number
  totalLiabilities: number
  totalEquity: number
  totalLiabilitiesAndEquity: number
  isBalanced: boolean
}

export interface CashFlowStatementData extends FinancialStatement {
  operatingActivities: number
  investingActivities: number
  financingActivities: number
  netChangeInCash: number
  beginningCash: number
  endingCash: number
}

export interface StatementFilters {
  periodId: string
  entityId: string
  comparePeriodId?: string
  consolidate?: boolean
  currency?: string
}
