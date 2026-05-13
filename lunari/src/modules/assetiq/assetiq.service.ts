import type { ServiceContext } from '../../platform/types/core'
import { generateId } from '../../engine/ledger.engine'
import type { FixedAsset, DepreciationLine } from './types'

const _assets: Map<string, FixedAsset> = new Map()
const _depreciationLines: Map<string, DepreciationLine[]> = new Map()

;(function seed() {
  const assets: FixedAsset[] = [
    { id: 'asset-001', tenantId: 'tenant-acme', entityId: 'entity-us', assetNumber: 'FA-2022-001', name: 'Server Cluster A', description: 'Primary data center server cluster', category: 'IT Equipment', subCategory: 'Servers', location: 'DC-1 Rack A', serialNumber: 'SVR-00441', vendor: 'TechParts Inc.', invoiceId: null, acquisitionDate: '2022-03-15', inServiceDate: '2022-04-01', currency: 'USD', acquisitionCost: 285000, salvageValue: 5000, depreciableBase: 280000, usefulLifeMonths: 60, depreciationMethod: 'straight_line', accumulatedDepreciation: 126000, netBookValue: 159000, status: 'active', disposedAt: null, disposalProceeds: null, gainLossOnDisposal: null, glAssetAccountId: 'acc-1600', glAssetAccountCode: '1600', glAccumDeprecAccountId: 'acc-1601', glAccumDeprecAccountCode: '1601', glDeprecExpenseAccountId: 'acc-5200', glDeprecExpenseAccountCode: '5200', lastDepreciationDate: '2024-12-31', notes: null, createdBy: 'user-accountant', createdAt: '2022-04-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
    { id: 'asset-002', tenantId: 'tenant-acme', entityId: 'entity-us', assetNumber: 'FA-2023-001', name: 'Office Renovation', description: 'HQ office renovation — floors 12-14', category: 'Leasehold Improvements', subCategory: 'Office', location: '500 Market St', serialNumber: null, vendor: 'BuildRight Contractors', invoiceId: null, acquisitionDate: '2023-01-31', inServiceDate: '2023-02-01', currency: 'USD', acquisitionCost: 425000, salvageValue: 0, depreciableBase: 425000, usefulLifeMonths: 48, depreciationMethod: 'straight_line', accumulatedDepreciation: 141666, netBookValue: 283334, status: 'active', disposedAt: null, disposalProceeds: null, gainLossOnDisposal: null, glAssetAccountId: 'acc-1610', glAssetAccountCode: '1610', glAccumDeprecAccountId: 'acc-1611', glAccumDeprecAccountCode: '1611', glDeprecExpenseAccountId: 'acc-5200', glDeprecExpenseAccountCode: '5200', lastDepreciationDate: '2024-12-31', notes: null, createdBy: 'user-accountant', createdAt: '2023-02-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
    { id: 'asset-003', tenantId: 'tenant-acme', entityId: 'entity-us', assetNumber: 'FA-2024-001', name: 'Network Infrastructure Upgrade', description: 'Core network switches and routers', category: 'IT Equipment', subCategory: 'Network', location: 'DC-1', serialNumber: 'NET-2024-BX', vendor: 'TechParts Inc.', invoiceId: 'ap-inv-005', acquisitionDate: '2024-11-15', inServiceDate: '2024-11-20', currency: 'USD', acquisitionCost: 8900, salvageValue: 500, depreciableBase: 8400, usefulLifeMonths: 36, depreciationMethod: 'straight_line', accumulatedDepreciation: 467, netBookValue: 8433, status: 'active', disposedAt: null, disposalProceeds: null, gainLossOnDisposal: null, glAssetAccountId: 'acc-1600', glAssetAccountCode: '1600', glAccumDeprecAccountId: 'acc-1601', glAccumDeprecAccountCode: '1601', glDeprecExpenseAccountId: 'acc-5200', glDeprecExpenseAccountCode: '5200', lastDepreciationDate: '2024-12-31', notes: null, createdBy: 'user-accountant', createdAt: '2024-11-20T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
    { id: 'asset-004', tenantId: 'tenant-acme', entityId: 'entity-us', assetNumber: 'FA-2019-001', name: 'Legacy Copiers (3 units)', description: 'Office copiers — 3rd floor', category: 'Office Equipment', subCategory: 'Copiers', location: '3rd Floor', serialNumber: 'CPY-445/446/447', vendor: 'Xerox', invoiceId: null, acquisitionDate: '2019-06-01', inServiceDate: '2019-06-01', currency: 'USD', acquisitionCost: 24000, salvageValue: 0, depreciableBase: 24000, usefulLifeMonths: 60, depreciationMethod: 'straight_line', accumulatedDepreciation: 24000, netBookValue: 0, status: 'fully_depreciated', disposedAt: null, disposalProceeds: null, gainLossOnDisposal: null, glAssetAccountId: 'acc-1620', glAssetAccountCode: '1620', glAccumDeprecAccountId: 'acc-1621', glAccumDeprecAccountCode: '1621', glDeprecExpenseAccountId: 'acc-5200', glDeprecExpenseAccountCode: '5200', lastDepreciationDate: '2024-05-31', notes: null, createdBy: 'user-accountant', createdAt: '2019-06-01T00:00:00Z', updatedAt: '2024-06-01T00:00:00Z' },
  ]
  for (const a of assets) _assets.set(a.id, a)
})()

export class AssetIQService {
  static async getAssets(ctx: ServiceContext): Promise<FixedAsset[]> {
    return Array.from(_assets.values()).filter((a) => a.tenantId === ctx.tenantId && a.entityId === ctx.entityId)
  }

  static async getAsset(ctx: ServiceContext, assetId: string): Promise<FixedAsset> {
    const asset = _assets.get(assetId)
    if (!asset || asset.tenantId !== ctx.tenantId) throw new Error('Asset not found')
    return asset
  }

  static async getDepreciationSchedule(assetId: string): Promise<DepreciationLine[]> {
    const asset = _assets.get(assetId)
    if (!asset) return []
    const existing = _depreciationLines.get(assetId)
    if (existing) return existing
    const lines: DepreciationLine[] = []
    const monthlyDeprec = Math.round((asset.depreciableBase / asset.usefulLifeMonths) * 100) / 100
    let accumDeprec = 0
    let nbv = asset.acquisitionCost
    const start = new Date(asset.inServiceDate)
    for (let i = 0; i < asset.usefulLifeMonths; i++) {
      const d = new Date(start)
      d.setMonth(d.getMonth() + i)
      const amount = Math.min(monthlyDeprec, nbv - asset.salvageValue)
      if (amount <= 0) break
      accumDeprec += amount
      const openNBV = nbv
      nbv -= amount
      lines.push({ id: generateId(), assetId, periodId: `period-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, periodLabel: `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]} ${d.getFullYear()}`, depreciationDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-30`, openingNBV: openNBV, depreciationAmount: amount, accumulatedDepreciation: accumDeprec, closingNBV: nbv, journalId: null, status: 'scheduled' })
    }
    _depreciationLines.set(assetId, lines)
    return lines
  }

  static async createAsset(ctx: ServiceContext, data: Omit<FixedAsset, 'id' | 'tenantId' | 'entityId' | 'accumulatedDepreciation' | 'netBookValue' | 'status' | 'disposedAt' | 'disposalProceeds' | 'gainLossOnDisposal' | 'lastDepreciationDate' | 'createdBy' | 'createdAt' | 'updatedAt'>): Promise<FixedAsset> {
    const asset: FixedAsset = { id: generateId(), tenantId: ctx.tenantId, entityId: ctx.entityId, accumulatedDepreciation: 0, netBookValue: data.acquisitionCost, status: 'active', disposedAt: null, disposalProceeds: null, gainLossOnDisposal: null, lastDepreciationDate: null, createdBy: ctx.userId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...data }
    _assets.set(asset.id, asset)
    return asset
  }
}
