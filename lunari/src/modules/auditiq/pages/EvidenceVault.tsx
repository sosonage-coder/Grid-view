import { useAudit } from '../hooks/useAudit'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { FileText, Upload } from 'lucide-react'
import { Button } from '../../../components/ui/Button'

export function EvidenceVault() {
  const { evidence, pbcItems, loading } = useAudit('2024')

  // Build evidence from PBC items (since evidence is nested inside items)
  const allEvidence = pbcItems.flatMap((item) => item.evidence)

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Evidence Vault</h1>
          <p className="text-sm text-slate-400 mt-0.5">{allEvidence.length + evidence.length} evidence items for Audit 2024</p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Upload className="h-3.5 w-3.5" />}>Upload Evidence</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-20 bg-slate-800 rounded-lg animate-pulse" />)}</div>
      ) : allEvidence.length === 0 && evidence.length === 0 ? (
        <div className="py-20 text-center">
          <FileText className="h-10 w-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500">No evidence uploaded yet</p>
          <p className="text-xs text-slate-600 mt-1">Upload supporting documents for audit requests</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pbcItems.filter((i) => i.evidence.length > 0).map((item) =>
            item.evidence.map((ev) => (
              <Card key={ev.id} className="flex items-start gap-3">
                <div className="h-9 w-9 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="h-4 w-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-200">{ev.title}</p>
                    <Badge variant={ev.status === 'accepted' ? 'success' : ev.status === 'submitted' ? 'warning' : ev.status === 'rejected' ? 'danger' : 'muted'}>
                      {ev.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{item.requestNumber} — {item.title}</p>
                  <p className="text-xs text-slate-600 mt-0.5">Prepared by {ev.preparedBy} · {new Date(ev.preparedAt).toLocaleDateString()}</p>
                </div>
                {ev.fileUrl && (
                  <Button variant="ghost" size="xs">View</Button>
                )}
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
