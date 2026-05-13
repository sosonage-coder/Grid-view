import { useState } from 'react'
import { Sparkles, AlertTriangle, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { AIService } from '../ai.service'
import { AuthService } from '../../platform/services/auth.service'
import type { JournalSuggestion } from '../types'
import { formatCurrency } from '../../platform/types/core'

interface AISuggestionPanelProps {
  onApply?: (suggestion: JournalSuggestion) => void
}

export function AISuggestionPanel({ onApply }: AISuggestionPanelProps) {
  const [prompt, setPrompt] = useState('')
  const [suggestion, setSuggestion] = useState<JournalSuggestion | null>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const ctx = AuthService.getServiceContext()

  const generate = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setSuggestion(null)
    try {
      const result = await AIService.suggestJournalEntry(ctx, prompt)
      setSuggestion(result)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-800/80 border border-blue-800/40 rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700/30 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-medium text-blue-300">AI Journal Assistant</span>
          <span className="text-xs text-slate-500">— suggestions only, never auto-posts</span>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              placeholder="e.g. 'monthly depreciation for IT equipment' or 'payroll accrual'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void generate()}
            />
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Sparkles className="h-3.5 w-3.5" />}
              loading={loading}
              onClick={() => void generate()}
              disabled={!prompt.trim()}
            >
              Suggest
            </Button>
          </div>

          {suggestion && (
            <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-3 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-slate-200">{suggestion.description}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{suggestion.reasoning}</p>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <div
                    className="h-1.5 w-16 bg-slate-700 rounded-full overflow-hidden"
                    title={`${Math.round(suggestion.confidence * 100)}% confidence`}
                  >
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${suggestion.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-slate-400">{Math.round(suggestion.confidence * 100)}%</span>
                </div>
              </div>

              {suggestion.warnings.length > 0 && (
                <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-900/20 rounded p-2">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  <ul className="space-y-0.5">
                    {suggestion.warnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}

              <div className="space-y-1">
                {suggestion.suggestedLines.map((line, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-slate-700/50 last:border-0">
                    <div>
                      <span className="font-mono text-slate-400">{line.accountCode}</span>
                      <span className="ml-2 text-slate-300">{line.accountName}</span>
                    </div>
                    <div className="flex gap-6 font-mono text-right">
                      <span className={line.debit && line.debit > 0 ? 'text-slate-200' : 'text-slate-600'}>
                        {line.debit && line.debit > 0 ? formatCurrency(line.debit, 'USD') : '—'}
                      </span>
                      <span className={line.credit && line.credit > 0 ? 'text-slate-200' : 'text-slate-600'}>
                        {line.credit && line.credit > 0 ? formatCurrency(line.credit, 'USD') : '—'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {onApply && (
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Check className="h-3.5 w-3.5" />}
                  className="w-full"
                  onClick={() => onApply(suggestion)}
                >
                  Apply to Journal (requires your review)
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
