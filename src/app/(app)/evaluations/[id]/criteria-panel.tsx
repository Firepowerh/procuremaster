'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Sparkles, Trash2, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { deleteCriterionAction, addCriterionAction } from '../actions'

interface Criterion {
  id: string
  name: string
  description: string | null
  weight: number
  is_ai_suggested: boolean
}

interface Props {
  evaluationId: string
  criteria: Criterion[]
  onCriteriaChange?: (updated: Criterion[]) => void
}

export default function CriteriaPanel({ evaluationId, criteria, onCriteriaChange = () => {} }: Props) {
  const [suggesting, setSuggesting] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newWeight, setNewWeight] = useState('')
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0)

  const handleSuggest = async () => {
    setSuggesting(true)
    try {
      const res = await fetch(`/api/ai/suggest-criteria`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evaluation_id: evaluationId }),
      })
      const data = await res.json() as { criteria?: Criterion[]; error?: string }
      if (data.error) throw new Error(data.error)
      onCriteriaChange(data.criteria ?? [])
      toast.success(`${data.criteria?.length ?? 0} AI criteria suggested`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to suggest criteria')
    } finally {
      setSuggesting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setPendingDelete(id)
    const result = await deleteCriterionAction(id, evaluationId)
    setPendingDelete(null)
    if (result.error) {
      toast.error(result.error)
    } else {
      onCriteriaChange(criteria.filter((c) => c.id !== id))
    }
  }

  const handleAdd = async () => {
    if (!newName || !newWeight) return toast.error('Name and weight are required')
    const w = parseFloat(newWeight)
    if (isNaN(w) || w <= 0 || w > 100) return toast.error('Weight must be 1–100')

    const result = await addCriterionAction(evaluationId, newName, newDesc, w)
    if (result.error) {
      toast.error(result.error)
    } else {
      setNewName('')
      setNewDesc('')
      setNewWeight('')
      setAdding(false)
      // Reload handled by server revalidation on next navigation
      toast.success('Criterion added')
      window.location.reload()
    }
  }

  return (
    <div className="space-y-4">
      {/* Header + AI button */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">
          Total weight:{' '}
          <span className={totalWeight === 100 ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
            {totalWeight}%
          </span>
          {totalWeight !== 100 && ' (must equal 100%)'}
        </div>
        <Button size="sm" variant="outline" onClick={handleSuggest} disabled={suggesting}>
          {suggesting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
          ) : criteria.length > 0 ? (
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          )}
          {criteria.length > 0 ? 'Re-suggest with AI' : 'Suggest with AI'}
        </Button>
      </div>

      {/* Criteria list */}
      {criteria.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No criteria yet. Use AI to suggest or add manually.
        </p>
      ) : (
        <div className="space-y-2">
          {criteria.map((c) => (
            <div
              key={c.id}
              className="flex items-start gap-3 p-3 rounded-lg border bg-card"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{c.name}</span>
                  {c.is_ai_suggested && (
                    <span className="text-[10px] text-violet-600 dark:text-violet-400 flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                      AI
                    </span>
                  )}
                </div>
                {c.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.description}</p>
                )}
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <span className="text-sm font-semibold tabular-nums">{c.weight}%</span>
                <button
                  onClick={() => handleDelete(c.id)}
                  disabled={pendingDelete === c.id}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1"
                >
                  {pendingDelete === c.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add manually */}
      {adding ? (
        <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Technical Capability"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Weight %</Label>
              <Input
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                placeholder="e.g. 25"
                type="number"
                min="1"
                max="100"
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Description (optional)</Label>
            <Input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="What evaluators should assess..."
              className="h-8 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd}>Add</Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="ghost" className="w-full" onClick={() => setAdding(true)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Add criterion manually
        </Button>
      )}
    </div>
  )
}
