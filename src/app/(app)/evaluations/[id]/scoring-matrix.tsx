'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Zap, Pencil, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { overrideScoreAction } from '../actions'

interface Criterion {
  id: string
  name: string
  weight: number
}

interface VendorScore {
  id: string
  criterion_id: string
  vendor_account_id: string
  ai_score: number | null
  ai_reasoning: string | null
  override_score: number | null
  override_justification: string | null
  effective_score: number | null
}

interface Vendor {
  id: string
  company_name: string
}

interface Props {
  evaluationId: string
  criteria: Criterion[]
  vendors: Vendor[]
  scores: VendorScore[]
  status: string
}

export default function ScoringMatrix({ evaluationId, criteria, vendors, scores, status }: Props) {
  const [running, setRunning] = useState(false)
  const [editingScore, setEditingScore] = useState<string | null>(null) // score id
  const [overrideVal, setOverrideVal] = useState('')
  const [overrideJust, setOverrideJust] = useState('')

  const getScore = (vendorId: string, criterionId: string) =>
    scores.find((s) => s.vendor_account_id === vendorId && s.criterion_id === criterionId)

  const getWeightedTotal = (vendorId: string) => {
    return criteria.reduce((sum, c) => {
      const s = getScore(vendorId, c.id)
      const effective = s?.effective_score ?? s?.ai_score ?? null
      if (effective == null) return sum
      return sum + (effective * c.weight) / 100
    }, 0)
  }

  const handleRunScoring = async () => {
    setRunning(true)
    try {
      const res = await fetch('/api/ai/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evaluation_id: evaluationId }),
      })
      const data = await res.json() as { success?: boolean; vendors_scored?: number; error?: string }
      if (data.error) throw new Error(data.error)
      toast.success(`Scored ${data.vendors_scored} vendor${(data.vendors_scored ?? 0) !== 1 ? 's' : ''}`)
      window.location.reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Scoring failed')
    } finally {
      setRunning(false)
    }
  }

  const handleOverride = async (scoreId: string) => {
    const val = parseFloat(overrideVal)
    if (isNaN(val) || val < 0 || val > 10) return toast.error('Score must be 0–10')
    if (!overrideJust.trim()) return toast.error('Justification is required')

    const result = await overrideScoreAction(scoreId, evaluationId, val, overrideJust)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Score overridden')
      setEditingScore(null)
      window.location.reload()
    }
  }

  const hasScores = scores.length > 0

  return (
    <div className="space-y-4">
      {/* Run scoring button */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {hasScores ? `Last scored · run ${scores[0] ? Math.max(...scores.map((s) => 1)) : 0}` : 'No scores yet'}
        </p>
        <Button size="sm" onClick={handleRunScoring} disabled={running || criteria.length === 0}>
          {running ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
          ) : (
            <Zap className="w-3.5 h-3.5 mr-1.5" />
          )}
          {hasScores ? 'Re-run AI Scoring' : 'Run AI Scoring'}
        </Button>
      </div>

      {vendors.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No vendors in this RFP yet.</p>
      ) : !hasScores ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          Run AI scoring to populate the matrix.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="text-left text-xs font-medium text-muted-foreground py-2 pr-4 w-40">
                  Criterion
                </th>
                {vendors.map((v) => (
                  <th
                    key={v.id}
                    className="text-center text-xs font-medium text-muted-foreground py-2 px-3 min-w-[120px]"
                  >
                    {v.company_name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {criteria.map((c) => (
                <tr key={c.id} className="border-t border-border/50">
                  <td className="py-2.5 pr-4 align-top">
                    <p className="text-xs font-medium">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground">{c.weight}%</p>
                  </td>
                  {vendors.map((v) => {
                    const s = getScore(v.id, c.id)
                    const isEditing = editingScore === s?.id

                    if (!s) {
                      return (
                        <td key={v.id} className="py-2.5 px-3 text-center">
                          <span className="text-xs text-muted-foreground">—</span>
                        </td>
                      )
                    }

                    const displayScore = s.override_score ?? s.ai_score
                    const isOverridden = s.override_score != null

                    return (
                      <td key={v.id} className="py-2.5 px-3 text-center align-top">
                        {isEditing ? (
                          <div className="space-y-1 text-left">
                            <Input
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              value={overrideVal}
                              onChange={(e) => setOverrideVal(e.target.value)}
                              className="h-7 text-xs w-16"
                              placeholder="0–10"
                            />
                            <Input
                              value={overrideJust}
                              onChange={(e) => setOverrideJust(e.target.value)}
                              className="h-7 text-xs"
                              placeholder="Justification..."
                            />
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleOverride(s.id)}
                                className="text-emerald-600 hover:text-emerald-700 p-0.5"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingScore(null)}
                                className="text-muted-foreground hover:text-foreground p-0.5"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="group/score relative inline-flex flex-col items-center">
                            <span
                              className={`text-sm font-semibold ${
                                (displayScore ?? 0) >= 7
                                  ? 'text-emerald-600'
                                  : (displayScore ?? 0) >= 4
                                    ? 'text-amber-600'
                                    : 'text-red-600'
                              } ${isOverridden ? 'underline decoration-dotted' : ''}`}
                              title={
                                isOverridden
                                  ? `AI: ${s.ai_score} · Override: ${s.override_score}\n${s.override_justification}`
                                  : s.ai_reasoning ?? undefined
                              }
                            >
                              {displayScore?.toFixed(1) ?? '—'}
                            </span>
                            {isOverridden && (
                              <span className="text-[9px] text-violet-600">overridden</span>
                            )}
                            <button
                              onClick={() => {
                                setEditingScore(s.id)
                                setOverrideVal(String(displayScore ?? ''))
                                setOverrideJust(s.override_justification ?? '')
                              }}
                              className="absolute -right-4 top-0 opacity-0 group-hover/score:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                            >
                              <Pencil className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
              {/* Weighted total row */}
              <tr className="border-t-2 border-border">
                <td className="py-2.5 pr-4">
                  <p className="text-xs font-semibold">Weighted Total</p>
                </td>
                {vendors.map((v) => {
                  const total = getWeightedTotal(v.id)
                  return (
                    <td key={v.id} className="py-2.5 px-3 text-center">
                      <span
                        className={`text-sm font-bold ${
                          total >= 7 ? 'text-emerald-600' : total >= 4 ? 'text-amber-600' : 'text-red-600'
                        }`}
                      >
                        {total.toFixed(2)}
                      </span>
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
