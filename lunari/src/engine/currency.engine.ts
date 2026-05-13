import type { FXRate } from '../platform/types/ledger'
import { generateId } from './ledger.engine'

// ─── In-memory FX rate store ──────────────────────────────────────────────────

const _fxRates: FXRate[] = [
  { id: generateId(), tenantId: '*', fromCurrency: 'EUR', toCurrency: 'USD', rate: 1.0875, rateType: 'spot', effectiveDate: '2024-12-31', source: 'ECB', createdAt: '2024-12-31T00:00:00Z' },
  { id: generateId(), tenantId: '*', fromCurrency: 'GBP', toCurrency: 'USD', rate: 1.2731, rateType: 'spot', effectiveDate: '2024-12-31', source: 'BoE', createdAt: '2024-12-31T00:00:00Z' },
  { id: generateId(), tenantId: '*', fromCurrency: 'JPY', toCurrency: 'USD', rate: 0.00664, rateType: 'spot', effectiveDate: '2024-12-31', source: 'BOJ', createdAt: '2024-12-31T00:00:00Z' },
  { id: generateId(), tenantId: '*', fromCurrency: 'CAD', toCurrency: 'USD', rate: 0.7375, rateType: 'spot', effectiveDate: '2024-12-31', source: 'BoC', createdAt: '2024-12-31T00:00:00Z' },
  { id: generateId(), tenantId: '*', fromCurrency: 'AUD', toCurrency: 'USD', rate: 0.6215, rateType: 'spot', effectiveDate: '2024-12-31', source: 'RBA', createdAt: '2024-12-31T00:00:00Z' },
  { id: generateId(), tenantId: '*', fromCurrency: 'CHF', toCurrency: 'USD', rate: 1.1104, rateType: 'spot', effectiveDate: '2024-12-31', source: 'SNB', createdAt: '2024-12-31T00:00:00Z' },
  { id: generateId(), tenantId: '*', fromCurrency: 'SGD', toCurrency: 'USD', rate: 0.7412, rateType: 'spot', effectiveDate: '2024-12-31', source: 'MAS', createdAt: '2024-12-31T00:00:00Z' },
  { id: generateId(), tenantId: '*', fromCurrency: 'USD', toCurrency: 'USD', rate: 1.0, rateType: 'spot', effectiveDate: '2024-12-31', source: 'system', createdAt: '2024-12-31T00:00:00Z' },
]

// ─── CurrencyEngine ───────────────────────────────────────────────────────────

export class CurrencyEngine {
  /**
   * Get the exchange rate from one currency to another.
   * Tries direct rate, then inverse. Falls back to 1.0 for same currency.
   */
  static getRate(
    fromCurrency: string,
    toCurrency: string,
    tenantId?: string,
    asOfDate?: string,
  ): number {
    if (fromCurrency === toCurrency) return 1.0

    const date = asOfDate ?? new Date().toISOString().slice(0, 10)

    // Find the most recent rate at or before the date
    const rates = _fxRates
      .filter((r) =>
        (r.tenantId === tenantId || r.tenantId === '*') &&
        r.fromCurrency === fromCurrency &&
        r.toCurrency === toCurrency &&
        r.effectiveDate <= date,
      )
      .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))

    if (rates.length > 0) return rates[0].rate

    // Try inverse
    const inverseRates = _fxRates
      .filter((r) =>
        (r.tenantId === tenantId || r.tenantId === '*') &&
        r.fromCurrency === toCurrency &&
        r.toCurrency === fromCurrency &&
        r.effectiveDate <= date,
      )
      .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))

    if (inverseRates.length > 0) return 1 / inverseRates[0].rate

    // Try via USD
    const fromToUSD = this.getDirectRate(fromCurrency, 'USD', tenantId, date)
    const toToUSD = this.getDirectRate(toCurrency, 'USD', tenantId, date)
    if (fromToUSD && toToUSD) {
      return fromToUSD / toToUSD
    }

    console.warn(`No FX rate found for ${fromCurrency}/${toCurrency} as of ${date}, defaulting to 1.0`)
    return 1.0
  }

  private static getDirectRate(
    from: string,
    to: string,
    tenantId?: string,
    date?: string,
  ): number | null {
    if (from === to) return 1.0
    const d = date ?? new Date().toISOString().slice(0, 10)
    const rates = _fxRates
      .filter((r) =>
        (r.tenantId === tenantId || r.tenantId === '*') &&
        r.fromCurrency === from &&
        r.toCurrency === to &&
        r.effectiveDate <= d,
      )
      .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))
    return rates.length > 0 ? rates[0].rate : null
  }

  /**
   * Translate an amount from one currency to another.
   */
  static translate(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    tenantId?: string,
    asOfDate?: string,
  ): { translatedAmount: number; rate: number } {
    const rate = this.getRate(fromCurrency, toCurrency, tenantId, asOfDate)
    const translatedAmount = Math.round(amount * rate * 100) / 100
    return { translatedAmount, rate }
  }

  /**
   * Calculate revaluation gain/loss for a monetary balance.
   */
  static calculateRevaluation(
    balance: number,
    _currency: string,
    _functionalCurrency: string,
    bookRate: number,
    currentRate: number,
  ): {
    originalFunctionalAmount: number
    revaluedFunctionalAmount: number
    revaluationGainLoss: number
  } {
    const originalFunctionalAmount = Math.round(balance * bookRate * 100) / 100
    const revaluedFunctionalAmount = Math.round(balance * currentRate * 100) / 100
    const revaluationGainLoss = revaluedFunctionalAmount - originalFunctionalAmount
    return { originalFunctionalAmount, revaluedFunctionalAmount, revaluationGainLoss }
  }

  /**
   * Add or update an FX rate.
   */
  static upsertRate(rate: Omit<FXRate, 'id' | 'createdAt'>): FXRate {
    const existing = _fxRates.find(
      (r) =>
        r.tenantId === rate.tenantId &&
        r.fromCurrency === rate.fromCurrency &&
        r.toCurrency === rate.toCurrency &&
        r.effectiveDate === rate.effectiveDate &&
        r.rateType === rate.rateType,
    )
    if (existing) {
      existing.rate = rate.rate
      existing.source = rate.source
      return existing
    }
    const newRate: FXRate = { ...rate, id: generateId(), createdAt: new Date().toISOString() }
    _fxRates.push(newRate)
    return newRate
  }

  /**
   * Get all rates for a tenant (and global) for a date range.
   */
  static getRates(tenantId: string, fromDate: string, toDate: string): FXRate[] {
    return _fxRates.filter(
      (r) =>
        (r.tenantId === tenantId || r.tenantId === '*') &&
        r.effectiveDate >= fromDate &&
        r.effectiveDate <= toDate,
    )
  }
}
