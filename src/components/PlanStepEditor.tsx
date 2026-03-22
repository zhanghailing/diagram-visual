import { useState } from 'react'
import { Plus, Trash2, GripVertical, GitMerge, Split } from 'lucide-react'
import { useStore } from '@/store'
import { simulatePlanMemo } from '@/lib/feasibility'
import { simulatePlanUpTo } from '@/lib/plan-simulation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { StructuralMergeStepForm } from './StructuralMergeStepForm'
import { StructuralSplitStepForm } from './StructuralSplitStepForm'
import type { PlanStep } from '@/types'

// ─── Add step form (state-transition) ────────────────────────────────────────

interface AddStepFormProps {
  planId: string
  onClose: () => void
}

function AddStepForm({ planId, onClose }: AddStepFormProps) {
  const allComponents = useStore((s) => s.project.components)
  const plan = useStore((s) => s.project.plans.find((p) => p.id === planId))
  const addStep = useStore((s) => s.addStep)

  // Filter to active components at insertion position (task 6.6)
  const lifecycle = plan ? simulatePlanUpTo(plan, allComponents, plan.steps.length - 1) : null
  const components = allComponents.filter((c) => !lifecycle || lifecycle.active.has(c.id))

  const [compId, setCompId] = useState('')
  const [fromState, setFromState] = useState('')
  const [toState, setToState] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const selectedComp = components.find((c) => c.id === compId)

  function handleAdd() {
    if (!compId || !fromState || !toState) return setError('All fields are required.')
    const result = addStep(planId, { type: 'state-transition', componentId: compId, fromState, toState, notes: notes.trim() || undefined })
    if (!result.ok) return setError(result.reason ?? 'Cannot add step')
    onClose()
  }

  return (
    <div className="p-3 border rounded-md bg-muted/30 space-y-2">
      <p className="text-xs font-medium">Add State Transition Step</p>
      <div className="space-y-1.5">
        <Label className="text-xs">Component</Label>
        <Select value={compId} onValueChange={(v) => { setCompId(v); setFromState(''); setToState(''); setError(null) }}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select component..." />
          </SelectTrigger>
          <SelectContent>
            {components.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">From State</Label>
          <Select value={fromState} onValueChange={(v) => { setFromState(v); setError(null) }} disabled={!selectedComp}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="From..." />
            </SelectTrigger>
            <SelectContent>
              {selectedComp?.states.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">To State</Label>
          <Select value={toState} onValueChange={(v) => { setToState(v); setError(null) }} disabled={!selectedComp}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="To..." />
            </SelectTrigger>
            <SelectContent>
              {selectedComp?.states.filter((s) => s.id !== fromState).map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Notes (optional)</Label>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What happens in this step?"
          className="h-8 text-xs"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={handleAdd}>Add Step</Button>
      </div>
    </div>
  )
}

// ─── Step type chooser ────────────────────────────────────────────────────────

type StepTypeChoice = 'state-transition' | 'structural-merge' | 'structural-split'

interface AddStepChooserProps {
  planId: string
  onClose: () => void
}

function AddStepChooser({ planId, onClose }: AddStepChooserProps) {
  const [stepType, setStepType] = useState<StepTypeChoice | null>(null)

  if (stepType === 'state-transition') {
    return <AddStepForm planId={planId} onClose={onClose} />
  }
  if (stepType === 'structural-merge') {
    return <StructuralMergeStepForm planId={planId} onClose={onClose} />
  }
  if (stepType === 'structural-split') {
    return <StructuralSplitStepForm planId={planId} onClose={onClose} />
  }

  return (
    <div className="p-3 border rounded-md bg-muted/30 space-y-2">
      <p className="text-xs font-medium">Choose Step Type</p>
      <div className="grid grid-cols-1 gap-1.5">
        <Button
          size="sm"
          variant="outline"
          className="justify-start gap-2 h-9"
          onClick={() => setStepType('state-transition')}
        >
          <span className="text-muted-foreground">→</span>
          <div className="text-left">
            <div className="text-xs font-medium">State Transition</div>
            <div className="text-xs text-muted-foreground">Move a component from one state to another</div>
          </div>
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="justify-start gap-2 h-9"
          onClick={() => setStepType('structural-merge')}
        >
          <GitMerge className="h-4 w-4 text-purple-600 shrink-0" />
          <div className="text-left">
            <div className="text-xs font-medium">Structural Merge</div>
            <div className="text-xs text-muted-foreground">Merge 2+ components into a new successor</div>
          </div>
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="justify-start gap-2 h-9"
          onClick={() => setStepType('structural-split')}
        >
          <Split className="h-4 w-4 text-indigo-600 shrink-0" />
          <div className="text-left">
            <div className="text-xs font-medium">Structural Split</div>
            <div className="text-xs text-muted-foreground">Split a component into 2+ new successors</div>
          </div>
        </Button>
      </div>
      <div className="flex justify-end">
        <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  )
}

// ─── Step row ─────────────────────────────────────────────────────────────────

interface StepRowProps {
  step: PlanStep
  planId: string
  index: number
  status: 'ok' | 'violation' | 'unvalidated'
  reason?: string
  isSelected: boolean
  onSelect: () => void
  onMoveUp: () => void
}

function StepRow({
  step,
  planId,
  index,
  status,
  reason,
  isSelected,
  onSelect,
  onMoveUp,
}: StepRowProps) {
  const components = useStore((s) => s.project.components)
  const deleteStep = useStore((s) => s.deleteStep)

  const statusClass = {
    ok: 'border-l-green-400',
    violation: 'border-l-red-400 bg-red-50',
    unvalidated: 'border-l-gray-300 opacity-60',
  }[status]

  function renderStepContent() {
    if (step.type === 'state-transition') {
      const comp = components.find((c) => c.id === step.componentId)
      const fromStateName = comp?.states.find((s) => s.id === step.fromState)?.name ?? step.fromState
      const toStateName = comp?.states.find((s) => s.id === step.toState)?.name ?? step.toState
      return (
        <>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground w-5 shrink-0">#{index + 1}</span>
            <span className="text-sm font-medium truncate">{comp?.name ?? step.componentId}</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5 pl-6 text-xs">
            <span className="text-muted-foreground">{fromStateName}</span>
            <span className="text-muted-foreground">→</span>
            <span className="font-medium">{toStateName}</span>
          </div>
          {step.notes && (
            <p className="text-xs text-muted-foreground mt-0.5 pl-6 italic truncate">{step.notes}</p>
          )}
        </>
      )
    }

    if (step.type === 'structural-merge') {
      const sourceNames = step.sourceIds.map(
        (id) => components.find((c) => c.id === id)?.name ?? id,
      )
      return (
        <>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground w-5 shrink-0">#{index + 1}</span>
            <GitMerge className="h-3 w-3 text-purple-600 shrink-0" />
            <span className="text-sm font-medium text-purple-800">Structural Merge</span>
          </div>
          <div className="mt-0.5 pl-6 text-xs text-muted-foreground">
            {sourceNames.join(', ')} → {step.successorComponent.name}
          </div>
          {step.notes && (
            <p className="text-xs text-muted-foreground mt-0.5 pl-6 italic truncate">{step.notes}</p>
          )}
        </>
      )
    }

    if (step.type === 'structural-split') {
      const srcName = components.find((c) => c.id === step.sourceId)?.name ?? step.sourceId
      const successorNames = step.successorComponents.map((c) => c.name)
      return (
        <>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground w-5 shrink-0">#{index + 1}</span>
            <Split className="h-3 w-3 text-indigo-600 shrink-0" />
            <span className="text-sm font-medium text-indigo-800">Structural Split</span>
          </div>
          <div className="mt-0.5 pl-6 text-xs text-muted-foreground">
            {srcName} → {successorNames.join(', ')}
          </div>
          {step.notes && (
            <p className="text-xs text-muted-foreground mt-0.5 pl-6 italic truncate">{step.notes}</p>
          )}
        </>
      )
    }
  }

  return (
    <div
      onClick={onSelect}
      className={cn(
        'group flex items-start gap-2 p-2 rounded-md border-l-4 cursor-pointer hover:bg-accent/50 transition-colors',
        statusClass,
        isSelected && 'ring-1 ring-primary',
      )}
    >
      <div className="flex flex-col gap-0.5 shrink-0 pt-0.5">
        <button
          onClick={(e) => { e.stopPropagation(); onMoveUp() }}
          disabled={index === 0}
          className="h-4 w-4 disabled:opacity-30 hover:bg-accent rounded"
          aria-label="Move step up"
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 min-w-0">
        {renderStepContent()}
        {status === 'violation' && reason && (
          <p className="text-xs text-destructive mt-0.5 pl-6">{reason}</p>
        )}
      </div>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 shrink-0">
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-destructive"
          onClick={(e) => { e.stopPropagation(); deleteStep(planId, step.id) }}
          aria-label="Delete step"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

// ─── Main editor ─────────────────────────────────────────────────────────────

export function PlanStepEditor({ planId }: { planId: string }) {
  const plan = useStore((s) => s.project.plans.find((p) => p.id === planId))
  const components = useStore((s) => s.project.components)
  const dependencies = useStore((s) => s.project.dependencies)
  const reorderSteps = useStore((s) => s.reorderSteps)
  const selectedStepId = useStore((s) => s.selectedStepId)
  const setSelectedStep = useStore((s) => s.setSelectedStep)

  const [showAddStep, setShowAddStep] = useState(false)

  if (!plan) return null

  const feasibility = simulatePlanMemo(plan, dependencies, components)
  const stepResultMap = Object.fromEntries(feasibility.steps.map((r) => [r.stepId, r]))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">{plan.name}</h3>
        {plan.description && (
          <p className="text-xs text-muted-foreground">{plan.description}</p>
        )}
      </div>

      {plan.steps.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm border rounded-md bg-muted/20">
          <p className="mb-1">No steps yet.</p>
          <p className="text-xs">Add the first migration step below.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {plan.steps.map((step, i) => {
            const result = stepResultMap[step.id]
            return (
              <StepRow
                key={step.id}
                step={step}
                planId={planId}
                index={i}
                status={result?.status ?? 'ok'}
                reason={result?.reason}
                isSelected={step.id === selectedStepId}
                onSelect={() => setSelectedStep(step.id === selectedStepId ? null : step.id)}
                onMoveUp={() => reorderSteps(planId, i, i - 1)}
              />
            )
          })}
        </div>
      )}

      {showAddStep ? (
        <AddStepChooser planId={planId} onClose={() => setShowAddStep(false)} />
      ) : (
        <Button size="sm" variant="outline" onClick={() => setShowAddStep(true)} className="w-full">
          <Plus className="h-4 w-4 mr-1" /> Add Step
        </Button>
      )}
    </div>
  )
}
