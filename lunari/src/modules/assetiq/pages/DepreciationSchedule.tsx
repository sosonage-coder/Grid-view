import { useState, useEffect } from 'react'
import { useAssets } from '../hooks/useAssets'
import { AssetIQService } from '../assetiq.service'
import { Card, CardHeader } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { formatCurrency } from '../../../platform/types/core'
import type { DepreciationLine } from '../types'

export function DepreciationSchedule() {
  const { assets, loading: assetsLoading } = useAssets()
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null)
  const [schedule, setSchedule] = useState<DepreciationLine[]>([])
  const [schedLoading, setSchedLoading] = useState(false)
  const activeAssets = assets.filter((a) => a.status === 'active')

  useEffect(() => {
    if (!selectedAssetId) return
    setSchedLoading(true)
    AssetIQService.getDepreciationSchedule(selectedAssetId).then((lines) => {
      setSchedule(lines)
      setSchedLoading(false)
    })
  }, [selectedAssetId])

  useEffect(() => {
    if (!selectedAssetId && activeAssets.length > 0) setSelectedAssetId(activeAssets[0].id)
  }, [activeAssets]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedAsset = assets.find((a) => a.id === selectedAssetId)

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-100">Depreciation Schedule</h1>

      <div className="flex items-center gap-3">
        <select
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
          value={selectedAssetId ?? ''}
          onChange={(e) => setSelectedAssetId(e.target.value)}
        >
          {activeAssets.map((a) => <option key={a.id} value={a.id}>{a.assetNumber} — {a.name}</option>)}
        </select>
      </div>

      {selectedAsset && (
        <Card>
          <CardHeader>
            <div>
              <p className="text-sm font-bold text-slate-200">{selectedAsset.name}</p>
              <p className="text-xs text-slate-500">{selectedAsset.depreciationMethod.replace('_', ' ')} · {selectedAsset.usefulLifeMonths} months</p>
            </div>
            <div className="text-right text-xs">
              <p className="text-slate-400">NBV: <span className="font-mono text-slate-100">{formatCurrency(selectedAsset.netBookValue, selectedAsset.currency)}</span></p>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400">
                  <th className="text-left px-3 py-2">Period</th>
                  <th className="text-right px-3 py-2">Opening NBV</th>
                  <th className="text-right px-3 py-2">Depreciation</th>
                  <th className="text-right px-3 py-2">Accum. Depr.</th>
                  <th className="text-right px-3 py-2">Closing NBV</th>
                  <th className="text-center px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {(schedLoading || assetsLoading) ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i} className="border-b border-slate-700/50">
                      {[...Array(6)].map((__, j) => <td key={j} className="px-3 py-2"><div className="h-3 bg-slate-700 rounded animate-pulse" /></td>)}
                    </tr>
                  ))
                ) : (
                  schedule.slice(0, 24).map((line) => (
                    <tr key={line.id} className="border-b border-slate-700/50">
                      <td className="px-3 py-1.5 font-mono text-slate-400">{line.periodLabel}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{formatCurrency(line.openingNBV, selectedAsset.currency)}</td>
                      <td className="px-3 py-1.5 text-right font-mono text-red-400">({formatCurrency(line.depreciationAmount, selectedAsset.currency)})</td>
                      <td className="px-3 py-1.5 text-right font-mono text-slate-400">{formatCurrency(line.accumulatedDepreciation, selectedAsset.currency)}</td>
                      <td className="px-3 py-1.5 text-right font-mono text-slate-200">{formatCurrency(line.closingNBV, selectedAsset.currency)}</td>
                      <td className="px-3 py-1.5 text-center"><Badge variant={line.status === 'posted' ? 'success' : 'muted'} size="sm">{line.status}</Badge></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
