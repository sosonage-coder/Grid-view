export type AssetStatus = 'active' | 'disposed' | 'fully_depreciated' | 'impaired' | 'held_for_sale'
export type DepreciationMethod = 'straight_line' | 'declining_balance' | 'sum_of_years' | 'units_of_production'

export interface FixedAsset {
  id: string
  tenantId: string
  entityId: string
  assetNumber: string
  name: string
  description: string
  category: string
  subCategory: string
  location: string | null
  serialNumber: string | null
  vendor: string | null
  invoiceId: string | null
  acquisitionDate: string
  inServiceDate: string
  currency: string
  acquisitionCost: number
  salvageValue: number
  depreciableBase: number
  usefulLifeMonths: number
  depreciationMethod: DepreciationMethod
  accumulatedDepreciation: number
  netBookValue: number
  status: AssetStatus
  disposedAt: string | null
  disposalProceeds: number | null
  gainLossOnDisposal: number | null
  glAssetAccountId: string
  glAssetAccountCode: string
  glAccumDeprecAccountId: string
  glAccumDeprecAccountCode: string
  glDeprecExpenseAccountId: string
  glDeprecExpenseAccountCode: string
  lastDepreciationDate: string | null
  notes: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface DepreciationLine {
  id: string
  assetId: string
  periodId: string
  periodLabel: string
  depreciationDate: string
  openingNBV: number
  depreciationAmount: number
  accumulatedDepreciation: number
  closingNBV: number
  journalId: string | null
  status: 'scheduled' | 'posted' | 'reversed'
}

export interface AssetDisposal {
  id: string
  assetId: string
  disposalDate: string
  disposalType: 'sale' | 'scrap' | 'donation' | 'write_off'
  proceeds: number
  netBookValue: number
  gainLoss: number
  journalId: string | null
  approvedBy: string | null
  notes: string | null
  createdAt: string
}
