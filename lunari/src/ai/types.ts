import type { JournalLine } from '../platform/types/ledger'

export interface JournalSuggestion {
  description: string
  suggestedLines: Partial<JournalLine>[]
  confidence: number // 0-1
  reasoning: string
  warnings: string[]
}

export type AnomalySeverity = 'critical' | 'warning' | 'info'

export interface AnomalyFlag {
  id: string
  journalId: string
  type: 'unusual_amount' | 'round_number' | 'weekend_posting' | 'end_of_period' | 'unusual_account' | 'duplicate_risk' | 'sod_violation' | 'policy_breach'
  severity: AnomalySeverity
  description: string
  recommendation: string
  confidence: number
  detectedAt: string
}

export interface CloseBlockerSummary {
  periodId: string
  totalBlockers: number
  criticalBlockers: number
  estimatedDaysToClose: number
  blockers: CloseBlockerItem[]
  aiSummary: string
}

export interface CloseBlockerItem {
  module: string
  description: string
  count: number
  isCritical: boolean
  suggestedAction: string
}

export interface MatchSuggestion {
  candidateId: string
  candidateDescription: string
  matchScore: number // 0-1
  matchReason: string
  amountDifference: number
  requiresInvestigation: boolean
}

export interface VarianceExplanation {
  accountId: string
  currentPeriodAmount: number
  priorPeriodAmount: number
  variance: number
  variancePct: number
  explanation: string
  driverCategories: VarianceDriver[]
  requiresAttention: boolean
}

export interface VarianceDriver {
  category: string
  amount: number
  description: string
}

export interface EvidenceDraft {
  pbcItemId: string
  suggestedTitle: string
  suggestedDescription: string
  suggestedSources: string[]
  draftNarrative: string
  estimatedPrepTime: string
}
