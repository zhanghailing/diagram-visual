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

interface SuccessorDraft {
  id: string // local draft id
  name: string
  type: ComponentType
  states: ComponentState[]
}

function emptySuccessor(): SuccessorDraft {
  return {
    id: generateId(),
    name: '',
    type: 'backend',
    states: [{ id: generateId(), name: '' }, { id: generateId(), name: '' }],
  }
}

interface Props {
  planId: string
  onClose: () => void
}

export function StructuralSplitStepForm({ planId, onClose }: Props) {
  const components = useStore((s) => s.project.components)
  const plan = useStore((s) => s.project.plans.find((p) => p.id === planId))
  const addStructuralSplitStep = useStore((s) => s.addStructuralSplitStep)

  // Compute active components at the insertion point (end of plan)
  const lifecycle = plan
    ? simulatePlanUpTo(plan, components, plan.steps.length - 1)
    : null
  const activeComponents = components.filter((c) => !lifecycle || lifecycle.active.has(c.id))

  const [sourceId, setSourceId] = useState('')
  const [successors, setSuccessors] = useState<SuccessorDraft[]>([emptySuccessor(), emptySuccessor()])
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  function addSuccessor() {
    setSuccessors((prev) => [...prev, emptySuccessor()])
  }

  function removeSuccessor(id: string) {
    setSuccessors((prev) => prev.filter((s) => s.id !== id))
  }

  function updateSuccessor(id: string, updates: Partial<Omit<SuccessorDraft, 'id'>>) {
    setSuccessors((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)))
    setError(null)
  }

  function addStateToSuccessor(id: string) {
    setSuccessors((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, states: [...s.states, { id: generateId(), name: '' }] }
          : s,
      ),
    )
  }

  function removeStateFromSuccessor(successorId: string, stateId: string) {
    setSuccessors((prev) =>
      prev.map((s) =>
        s.id === successorId
          ? { ...s, states: s.states.filter((st) => st.id !== stateId) }
          : s,
      ),
    )
  }

  function updateStateInSuccessor(successorId: string, stateId: string, name: string) {
    setSuccessors((prev) =>
      prev.map((s) =>
        s.id === successorId
          ? { ...s, states: s.states.map((st) => (st.id === stateId ? { ...st, name } : st)) }
          : s,
      ),
    )
  }

  function handleAdd() {
    // Validate: exactly 1 source (task 6.5)
    if (!sourceId) return setError('Select the source component to split.')

    // Validate: at least 2 successors (task 6.5)
    if (successors.length < 2) return setError('A split requires at least 2 successor components.')

    // Validate all successor names
    const names = successors.map((s) => s.name.trim())
    for (const name of names) {
      if (!name) return setError('All successor component names are required.')
    }

    // Validate uniqueness (task 6.5)
    const uniqueNames = new Set(names)
    if (uniqueNames.size !== names.length) {
      return setError('All successor component names must be unique.')
    }

    // Check against existing components
    for (const name of names) {
      if (components.some((c) => c.name === name)) {
        return setError(`A component named "${name}" already exists.`)
      }
    }

    const successorDefs: ComponentDefinition[] = successors.map((s) => {
      const validStates = s.states.filter((st) => st.name.trim())
      return { name: s.name.trim(), type: s.type, states: validStates }
    })

    for (const def of successorDefs) {
      if (def.states.length < 2) {
        return setError(`Each successor must have at least 2 states.`)
      }
    }

    const result = addStructuralSplitStep(planId, {
      sourceId,
      successorComponents: successorDefs,
      notes: notes.trim() || undefined,
    })

    if (!result.ok) return setError(result.reason ?? 'Failed to add step.')
    onClose()
  }

  return (
    <div className="p-3 border rounded-md bg-indigo-50/50 border-indigo-200 space-y-3">
      <p className="text-xs font-semibold text-indigo-800">Add Structural Split Step</p>
      <p className="text-xs text-muted-foreground">
        Split 1 active component into 2+ new successor components.
      </p>

      {/* Source component selector */}
      <div className="space-y-1.5">
        <Label className="text-xs">Source Component</Label>
        <Select value={sourceId} onValueChange={(v) => { setSourceId(v); setError(null) }}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select component to split..." />
          </SelectTrigger>
          <SelectContent>
            {activeComponents.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Successor component definitions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Successor Components (2+)</Label>
          <Button type="button" size="sm" variant="outline" className="h-6 text-xs" onClick={addSuccessor}>
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>

        {successors.map((succ, idx) => (
          <div key={succ.id} className="rounded-md border border-indigo-200 p-2 bg-white space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-indigo-700">Successor {idx + 1}</p>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-5 w-5"
                onClick={() => removeSuccessor(succ.id)}
                disabled={successors.length <= 2}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div className="space-y-0.5">
                <Label className="text-xs">Name</Label>
                <Input
                  value={succ.name}
                  onChange={(e) => updateSuccessor(succ.id, { name: e.target.value })}
                  placeholder="Component name"
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-0.5">
                <Label className="text-xs">Type</Label>
                <Select
                  value={succ.type}
                  onValueChange={(v) => updateSuccessor(succ.id, { type: v as ComponentType })}
                >
                  <SelectTrigger className="h-7 text-xs">
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

            <div className="space-y-0.5">
              <Label className="text-xs">States</Label>
              <div className="space-y-0.5">
                {succ.states.map((st, si) => (
                  <div key={st.id} className="flex items-center gap-1">
                    <Input
                      value={st.name}
                      onChange={(e) => updateStateInSuccessor(succ.id, st.id, e.target.value)}
                      placeholder={si === 0 ? 'Initial state' : `State ${si + 1}`}
                      className="flex-1 h-6 text-xs"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 shrink-0"
                      onClick={() => removeStateFromSuccessor(succ.id, st.id)}
                      disabled={succ.states.length <= 2}
                    >
                      <X className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full h-6 text-xs mt-0.5"
                onClick={() => addStateToSuccessor(succ.id)}
              >
                <Plus className="h-2.5 w-2.5 mr-1" /> Add State
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <Label className="text-xs">Notes (optional)</Label>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Why is this component being split?"
          className="h-8 text-xs"
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={handleAdd}>Add Split Step</Button>
      </div>
    </div>
  )
}
