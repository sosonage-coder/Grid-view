import type { ServiceContext } from '../../platform/types/core'
import type { IncomeStatementData, BalanceSheetData, CashFlowStatementData, StatementFilters } from './types'

export class StatementIQService {
  static async getIncomeStatement(_ctx: ServiceContext, filters: StatementFilters): Promise<IncomeStatementData> {
    const periodLabel = filters.periodId.includes('2025') ? 'Jan 2025' : 'Dec 2024'
    return {
      title: 'Income Statement',
      entityId: filters.entityId,
      entityName: 'Acme US',
      currency: 'USD',
      periodId: filters.periodId,
      periodLabel,
      priorPeriodId: null,
      priorPeriodLabel: null,
      generatedAt: new Date().toISOString(),
      sections: [
        { title: 'Revenue', subtotal: 290000, priorSubtotal: 265000, lines: [
          { label: 'Software Revenue', accountIds: ['acc-4010'], amount: 195000, priorAmount: 175000, variance: 20000, variancePct: 11.4, isSubtotal: false, isTotal: false, indent: 1 },
          { label: 'Consulting Revenue', accountIds: ['acc-4020'], amount: 64000, priorAmount: 58000, variance: 6000, variancePct: 10.3, isSubtotal: false, isTotal: false, indent: 1 },
          { label: 'Support Revenue', accountIds: ['acc-4030'], amount: 31000, priorAmount: 32000, variance: -1000, variancePct: -3.1, isSubtotal: false, isTotal: false, indent: 1 },
          { label: 'Total Revenue', accountIds: [], amount: 290000, priorAmount: 265000, variance: 25000, variancePct: 9.4, isSubtotal: true, isTotal: false, indent: 0 },
        ]},
        { title: 'Cost of Revenue', subtotal: 87000, priorSubtotal: 82000, lines: [
          { label: 'Cost of Goods Sold', accountIds: ['acc-5001'], amount: 87000, priorAmount: 82000, variance: 5000, variancePct: 6.1, isSubtotal: false, isTotal: false, indent: 1 },
        ]},
        { title: 'Operating Expenses', subtotal: 148056, priorSubtotal: 138000, lines: [
          { label: 'Payroll & Benefits', accountIds: ['acc-5100'], amount: 85000, priorAmount: 80000, variance: 5000, variancePct: 6.25, isSubtotal: false, isTotal: false, indent: 1 },
          { label: 'Marketing Expenses', accountIds: ['acc-5050'], amount: 35000, priorAmount: 28000, variance: 7000, variancePct: 25.0, isSubtotal: false, isTotal: false, indent: 1 },
          { label: 'Legal Fees', accountIds: ['acc-5040'], amount: 8000, priorAmount: 12000, variance: -4000, variancePct: -33.3, isSubtotal: false, isTotal: false, indent: 1 },
          { label: 'Office & Facilities', accountIds: ['acc-5070'], amount: 15000, priorAmount: 15000, variance: 0, variancePct: 0, isSubtotal: false, isTotal: false, indent: 1 },
          { label: 'SaaS & Cloud', accountIds: ['acc-5020'], amount: 5056, priorAmount: 3000, variance: 2056, variancePct: 68.5, isSubtotal: false, isTotal: false, indent: 1 },
        ]},
      ],
      revenue: 290000,
      costOfRevenue: 87000,
      grossProfit: 203000,
      grossMargin: 70.0,
      operatingExpenses: 148056,
      operatingIncome: 54944,
      otherIncome: 2500,
      interestExpense: 1800,
      incomeBeforeTax: 55644,
      taxExpense: 13911,
      netIncome: 41733,
      ebitda: 68500,
    }
  }

  static async getBalanceSheet(_ctx: ServiceContext, filters: StatementFilters): Promise<BalanceSheetData> {
    const periodLabel = filters.periodId.includes('2025') ? 'Jan 2025' : 'Dec 2024'
    return {
      title: 'Balance Sheet',
      entityId: filters.entityId,
      entityName: 'Acme US',
      currency: 'USD',
      periodId: filters.periodId,
      periodLabel,
      priorPeriodId: null,
      priorPeriodLabel: null,
      generatedAt: new Date().toISOString(),
      sections: [
        { title: 'Current Assets', subtotal: 3904500, priorSubtotal: 3650000, lines: [
          { label: 'Cash & Equivalents', accountIds: ['acc-1010', 'acc-1011'], amount: 3297500, priorAmount: 3100000, variance: 197500, variancePct: 6.4, isSubtotal: false, isTotal: false, indent: 1 },
          { label: 'Accounts Receivable', accountIds: ['acc-1100'], amount: 290000, priorAmount: 245000, variance: 45000, variancePct: 18.4, isSubtotal: false, isTotal: false, indent: 1 },
          { label: 'Prepaid Expenses', accountIds: ['acc-1200'], amount: 317000, priorAmount: 305000, variance: 12000, variancePct: 3.9, isSubtotal: false, isTotal: false, indent: 1 },
        ]},
        { title: 'Non-Current Assets', subtotal: 3691267, priorSubtotal: 3780000, lines: [
          { label: 'Property & Equipment, net', accountIds: ['acc-1600'], amount: 450767, priorAmount: 490000, variance: -39233, variancePct: -8.0, isSubtotal: false, isTotal: false, indent: 1 },
          { label: 'Right-of-Use Assets, net', accountIds: ['acc-1500'], amount: 2240500, priorAmount: 2290000, variance: -49500, variancePct: -2.2, isSubtotal: false, isTotal: false, indent: 1 },
          { label: 'Goodwill & Intangibles', accountIds: ['acc-1700'], amount: 1000000, priorAmount: 1000000, variance: 0, variancePct: 0, isSubtotal: false, isTotal: false, indent: 1 },
        ]},
        { title: 'Current Liabilities', subtotal: 1041600, priorSubtotal: 980000, lines: [
          { label: 'Accounts Payable', accountIds: ['acc-2010'], amount: 98600, priorAmount: 85000, variance: 13600, variancePct: 16.0, isSubtotal: false, isTotal: false, indent: 1 },
          { label: 'Accrued Liabilities', accountIds: ['acc-2050', 'acc-2060'], amount: 341000, priorAmount: 310000, variance: 31000, variancePct: 10.0, isSubtotal: false, isTotal: false, indent: 1 },
          { label: 'Current Lease Liabilities', accountIds: ['acc-2100', 'acc-2110', 'acc-2120'], amount: 602000, priorAmount: 585000, variance: 17000, variancePct: 2.9, isSubtotal: false, isTotal: false, indent: 1 },
        ]},
        { title: 'Non-Current Liabilities', subtotal: 1394900, priorSubtotal: 1450000, lines: [
          { label: 'Long-Term Lease Liabilities', accountIds: ['acc-2100', 'acc-2110', 'acc-2120'], amount: 1394900, priorAmount: 1450000, variance: -55100, variancePct: -3.8, isSubtotal: false, isTotal: false, indent: 1 },
        ]},
        { title: 'Equity', subtotal: 5159267, priorSubtotal: 5000000, lines: [
          { label: 'Common Stock', accountIds: ['acc-3010'], amount: 1000000, priorAmount: 1000000, variance: 0, variancePct: 0, isSubtotal: false, isTotal: false, indent: 1 },
          { label: 'Retained Earnings', accountIds: ['acc-3020'], amount: 4117534, priorAmount: 3958267, variance: 159267, variancePct: 4.0, isSubtotal: false, isTotal: false, indent: 1 },
          { label: 'Current Period Income', accountIds: [], amount: 41733, priorAmount: 41733, variance: 0, variancePct: 0, isSubtotal: false, isTotal: false, indent: 1 },
        ]},
      ],
      totalCurrentAssets: 3904500,
      totalNonCurrentAssets: 3691267,
      totalAssets: 7595767,
      totalCurrentLiabilities: 1041600,
      totalNonCurrentLiabilities: 1394900,
      totalLiabilities: 2436500,
      totalEquity: 5159267,
      totalLiabilitiesAndEquity: 7595767,
      isBalanced: true,
    }
  }

  static async getCashFlowStatement(_ctx: ServiceContext, filters: StatementFilters): Promise<CashFlowStatementData> {
    const periodLabel = filters.periodId.includes('2025') ? 'Jan 2025' : 'Dec 2024'
    return {
      title: 'Cash Flow Statement',
      entityId: filters.entityId,
      entityName: 'Acme US',
      currency: 'USD',
      periodId: filters.periodId,
      periodLabel,
      priorPeriodId: null,
      priorPeriodLabel: null,
      generatedAt: new Date().toISOString(),
      sections: [
        { title: 'Operating Activities', subtotal: 89567, priorSubtotal: 82000, lines: [
          { label: 'Net Income', accountIds: [], amount: 41733, priorAmount: 38000, variance: 3733, variancePct: 9.8, isSubtotal: false, isTotal: false, indent: 1 },
          { label: 'Depreciation & Amortization', accountIds: ['acc-5200'], amount: 13556, priorAmount: 13000, variance: 556, variancePct: 4.3, isSubtotal: false, isTotal: false, indent: 1 },
          { label: 'Change in AR', accountIds: ['acc-1100'], amount: -45000, priorAmount: -20000, variance: -25000, variancePct: 125.0, isSubtotal: false, isTotal: false, indent: 1 },
          { label: 'Change in AP', accountIds: ['acc-2010'], amount: 13600, priorAmount: 8000, variance: 5600, variancePct: 70.0, isSubtotal: false, isTotal: false, indent: 1 },
          { label: 'Change in Accrued Liabilities', accountIds: [], amount: 65678, priorAmount: 43000, variance: 22678, variancePct: 52.7, isSubtotal: false, isTotal: false, indent: 1 },
        ]},
        { title: 'Investing Activities', subtotal: -8900, priorSubtotal: -25000, lines: [
          { label: 'Purchase of Fixed Assets', accountIds: [], amount: -8900, priorAmount: -25000, variance: 16100, variancePct: -64.4, isSubtotal: false, isTotal: false, indent: 1 },
        ]},
        { title: 'Financing Activities', subtotal: -55100, priorSubtotal: -52000, lines: [
          { label: 'Lease Principal Payments', accountIds: [], amount: -55100, priorAmount: -52000, variance: -3100, variancePct: 6.0, isSubtotal: false, isTotal: false, indent: 1 },
        ]},
      ],
      operatingActivities: 89567,
      investingActivities: -8900,
      financingActivities: -55100,
      netChangeInCash: 25567,
      beginningCash: 3271933,
      endingCash: 3297500,
    }
  }
}
