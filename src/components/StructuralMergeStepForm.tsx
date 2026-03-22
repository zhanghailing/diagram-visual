import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useStore } from '@/store'
import { generateId } from '@/lib/utils'
import { simulatePlanUpTo } from '@/lib/plan-simulation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ComponentDefinition, ComponentType, ComponentState } from '@/types'

const COMPONENT_TYPES: ComponentType[] = [
  'frontend', 'backend', 'library', 'gateway', 'platform', 'other',
]

interface Props {
  planId: string
  onClose: () => void
}

export function StructuralMergeStepForm({ planId, onClose }: Props) {
  const components = useStore((s) => s.project.components)
  const plan = useStore((s) => s.project.plans.find((p) => p.id === planId))
  const addStructuralMergeStep = useStore((s) => s.addStructuralMergeStep)

  // Compute active components at the insertion point (end of plan)
  const lifecycle = plan
    ? simulatePlanUpTo(plan, components, plan.steps.length - 1)
    : null
  const activeComponents = components.filter((c) => !lifecycle || lifecycle.active.has(c.id))

  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([])
  const [successorName, setSuccessorName] = useState('')
  const [successorType, setSuccessorType] = useState<ComponentType>('backend')
  const [successorStates, setSuccessorStates] = useState<ComponentState[]>([
    { id: generateId(), name: '' },
    { id: generateId(), name: '' },
  ])
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  function toggleSource(id: string) {
    setSelectedSourceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
    setError(null)
  }

  function addSuccessorState() {
    setSuccessorStates((prev) => [...prev, { id: generateId(), name: '' }])
  }

  function removeSuccessorState(id: string) {
    setSuccessorStates((prev) => prev.filter((s) => s.id !== id))
  }

  function updateSuccessorStateName(id: string, name: string) {
    setSuccessorStates((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)))
  }

  function handleAdd() {
    // Validate: at least 2 sources (task 6.4)
    if (selectedSourceIds.length < 2) {
      return setError('Select at least 2 source components to merge.')
    }
    const trimmedName = successorName.trim()
    if (!trimmedName) return setError('Successor component name is required.')

    const validStates = successorStates.filter((s) => s.name.trim())
    if (validStates.length < 2) return setError('Successor must have at least 2 states.')

    // Validate: successor name unique (task 6.4)
    if (components.some((c) => c.name === trimmedName)) {
      return setError(`A component named "${trimmedName}" already exists.`)
    }

    const successor: ComponentDefinition = {
      name: trimmedName,
      type: successorType,
      states: validStates,
    }

    const result = addStructuralMergeStep(planId, {
      sourceIds: selectedSourceIds,
      successorComponent: successor,
      notes: notes.trim() || undefined,
    })

    if (!result.ok) return setError(result.reason ?? 'Failed to add step.')
    onClose()
  }

  return (
    <div className="p-3 border rounded-md bg-purple-50/50 border-purple-200 space-y-3">
      <p className="text-xs font-semibold text-purple-800">Add Structural Merge Step</p>
      <p className="text-xs text-muted-foreground">
        Merge 2+ active components into a single new successor component.
      </p>

      {/* Source components selector */}
      <div className="space-y-1.5">
        <Label className="text-xs">Source Components (select 2+)</Label>
        <div className="space-y-1 max-h-40 overflow-y-auto border rounded-md p-1 bg-white">
          {activeComponents.length === 0 && (
            <p className="text-xs text-muted-foreground p-2">No active components available.</p>
          )}
          {activeComponents.map((c) => (
            <label
              key={c.id}
              className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-accent text-xs"
            >
              <input
                type="checkbox"
                checked={selectedSourceIds.includes(c.id)}
                onChange={() => toggleSource(c.id)}
                className="h-3 w-3"
              />
              <span className="font-medium">{c.name}</span>
              <span className="text-muted-foreground">({c.type})</span>
            </label>
          ))}
        </div>
        {selectedSourceIds.length > 0 && (
          <p className="text-xs text-purple-700">{selectedSourceIds.length} selected</p>
        )}
      </div>

      {/* Successor component definition */}
      <div className="space-y-2 rounded-md border border-purple-200 p-2 bg-white">
        <p className="text-xs font-medium text-purple-700">Successor Component</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Name</Label>
            <Input
              value={successorName}
              onChange={(e) => { setSuccessorName(e.target.value); setError(null) }}
              placeholder="e.g. Unified Gateway"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Type</Label>
            <Select value={successorType} onValueChange={(v) => setSuccessorType(v as ComponentType)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPONENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">States (ordered, first = initial)</Label>
          <div className="space-y-1">
            {successorStates.map((s, i) => (
              <div key={s.id} className="flex items-center gap-1">
                <Input
                  value={s.name}
                  onChange={(e) => updateSuccessorStateName(s.id, e.target.value)}
                  placeholder={i === 0 ? 'Initial state' : `State ${i + 1}`}
                  className="flex-1 h-7 text-xs"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0"
                  onClick={() => removeSuccessorState(s.id)}
                  disabled={successorStates.length <= 2}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          <Button type="button" size="sm" variant="outline" className="w-full h-7 text-xs mt-1" onClick={addSuccessorState}>
            <Plus className="h-3 w-3 mr-1" /> Add State
          </Button>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <Label className="text-xs">Notes (optional)</Label>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Why are these components being merged?"
          className="h-8 text-xs"
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={handleAdd}>Add Merge Step</Button>
      </div>
    </div>
  )
}
