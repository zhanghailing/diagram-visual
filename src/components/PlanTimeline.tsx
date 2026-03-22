import { useMemo } from 'react'
import { GitMerge, Split } from 'lucide-react'
import { useStore } from '@/store'
import { simulatePlanMemo, getStateAtStep } from '@/lib/feasibility'
import { simulatePlanUpTo } from '@/lib/plan-simulation'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { MigrationPlan, Component, StepResult, ReleaseEntry, PlanStep } from '@/types'

// ─── Regular timeline cell ────────────────────────────────────────────────────

interface CellProps {
  stateName: string
  isTransition: boolean
  result?: StepResult
  releaseStatus?: 'implemented' | 'released'
  isSelected: boolean
  onClick: () => void
}

function TimelineCell({
  stateName,
  isTransition,
  result,
  releaseStatus,
  isSelected,
  onClick,
}: CellProps) {
  const bgClass = useMemo(() => {
    if (!isTransition) return 'bg-white hover:bg-gray-50'
    if (result?.status === 'violation') return 'bg-red-100 hover:bg-red-200'
    if (result?.status === 'unvalidated') return 'bg-gray-100 hover:bg-gray-200 opacity-60'
    if (releaseStatus === 'released') return 'bg-green-100 hover:bg-green-200'
    if (releaseStatus === 'implemented') return 'bg-blue-50 hover:bg-blue-100'
    return 'bg-emerald-50 hover:bg-emerald-100'
  }, [isTransition, result, releaseStatus])

  const borderClass = useMemo(() => {
    if (result?.status === 'violation') return 'border-red-300'
    if (result?.status === 'unvalidated') return 'border-gray-200'
    if (isTransition) return 'border-emerald-300'
    return 'border-gray-100'
  }, [isTransition, result])

  return (
    <td
      onClick={onClick}
      className={cn(
        'border px-2 py-1.5 text-xs cursor-pointer transition-colors min-w-[110px]',
        bgClass,
        borderClass,
        isSelected && 'ring-2 ring-inset ring-primary',
      )}
      title={result?.reason}
    >
      <div className="flex items-center gap-1 flex-wrap">
        <span className={cn('truncate max-w-[80px]', !isTransition && 'text-muted-foreground')}>
          {stateName}
        </span>
        {isTransition && (
          <span className="shrink-0">
            {result?.status === 'violation' && <span className="text-red-500">✗</span>}
            {result?.status === 'unvalidated' && <span className="text-gray-400">?</span>}
            {result?.status === 'ok' && releaseStatus === 'released' && (
              <span className="text-green-600">✓</span>
            )}
            {result?.status === 'ok' && releaseStatus === 'implemented' && (
              <span className="text-blue-500">⏳</span>
            )}
          </span>
        )}
      </div>
    </td>
  )
}

// ─── Structural step cell ─────────────────────────────────────────────────────

type StructuralCellKind = 'source-retiring' | 'successor-intro' | 'suppressed' | 'normal'

interface StructuralCellProps {
  kind: StructuralCellKind
  stateName?: string
  isSelected: boolean
  onClick: () => void
  stepType: 'structural-merge' | 'structural-split'
  result?: StepResult
}

function StructuralStepCell({
  kind,
  stateName,
  isSelected,
  onClick,
  stepType,
  result,
}: StructuralCellProps) {
  if (kind === 'suppressed') {
    return (
      <td
        className={cn(
          'border px-2 py-1.5 text-xs min-w-[110px] bg-gray-50 cursor-pointer',
          isSelected && 'ring-2 ring-inset ring-primary',
        )}
        onClick={onClick}
      >
        <span className="text-gray-300 select-none">—</span>
      </td>
    )
  }

  if (kind === 'source-retiring') {
    // End-cap visual: strikethrough/fade-out for retiring component
    const isViolation = result?.status === 'violation'
    return (
      <td
        onClick={onClick}
        className={cn(
          'border px-2 py-1.5 text-xs cursor-pointer min-w-[110px] transition-colors',
          isViolation
            ? 'bg-red-100 hover:bg-red-200 border-red-300'
            : stepType === 'structural-merge'
            ? 'bg-purple-100 hover:bg-purple-200 border-purple-300'
            : 'bg-indigo-100 hover:bg-indigo-200 border-indigo-300',
          isSelected && 'ring-2 ring-inset ring-primary',
        )}
        title={result?.reason ?? 'Component retiring at this step'}
      >
        <div className="flex items-center gap-1">
          <span className="line-through opacity-60 truncate max-w-[70px]">{stateName}</span>
          <span className="text-xs opacity-70">⊘</span>
        </div>
      </td>
    )
  }

  if (kind === 'successor-intro') {
    // Introduction cell for successor component
    return (
      <td
        onClick={onClick}
        className={cn(
          'border px-2 py-1.5 text-xs cursor-pointer min-w-[110px] transition-colors',
          stepType === 'structural-merge'
            ? 'bg-purple-50 hover:bg-purple-100 border-purple-200'
            : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200',
          isSelected && 'ring-2 ring-inset ring-primary',
        )}
        title="Component introduced at this step"
      >
        <div className="flex items-center gap-1">
          <span className="font-medium truncate max-w-[70px]">{stateName}</span>
          <span className="text-xs opacity-70">★</span>
        </div>
      </td>
    )
  }

  // Normal cell
  return (
    <td
      onClick={onClick}
      className={cn(
        'border px-2 py-1.5 text-xs cursor-pointer min-w-[110px] bg-white hover:bg-gray-50',
        isSelected && 'ring-2 ring-inset ring-primary',
      )}
    >
      <span className="truncate max-w-[80px] text-muted-foreground">{stateName}</span>
    </td>
  )
}

// ─── Column header for structural steps ──────────────────────────────────────

interface StructuralStepHeaderProps {
  step: PlanStep & { type: 'structural-merge' | 'structural-split' }
  index: number
  isSelected: boolean
  onClick: () => void
  result?: StepResult
}

function StructuralStepHeader({ step, index, isSelected, onClick, result }: StructuralStepHeaderProps) {
  const components = useStore((s) => s.project.components)
  const isMerge = step.type === 'structural-merge'
  const isViolation = result?.status === 'violation'

  const label = isMerge ? step.successorComponent.name : (() => {
    const src = components.find((c) => c.id === step.sourceId)
    return src?.name ?? 'Split'
  })()

  return (
    <th
      onClick={onClick}
      className={cn(
        'border px-2 py-1.5 text-xs font-medium cursor-pointer text-center min-w-[110px]',
        isViolation
          ? 'bg-red-50 text-red-700'
          : isMerge
          ? 'bg-purple-50 text-purple-700'
          : 'bg-indigo-50 text-indigo-700',
        isSelected && 'bg-primary/10',
      )}
    >
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex items-center gap-1">
          <span>Step {index + 1}</span>
          {isMerge ? (
            <GitMerge className="h-3 w-3" />
          ) : (
            <Split className="h-3 w-3" />
          )}
          {isViolation && <span className="text-red-500">✗</span>}
        </div>
        <div className="font-normal text-muted-foreground truncate max-w-[100px] text-center text-xs">
          {isMerge ? 'Merge →' : 'Split'} {label}
        </div>
      </div>
    </th>
  )
}

// ─── Main PlanTimeline component ──────────────────────────────────────────────

interface PlanTimelineProps {
  plan: MigrationPlan
  components: Component[]
  visibleComponentIds?: string[] | null
  releases: ReleaseEntry[]
  selectedStepId: string | null
  onSelectStep: (stepId: string | null) => void
}

export function PlanTimeline({
  plan,
  components,
  visibleComponentIds,
  releases,
  selectedStepId,
  onSelectStep,
}: PlanTimelineProps) {
  const dependencies = useStore((s) => s.project.dependencies)
  const feasibility = simulatePlanMemo(plan, dependencies, components)
  const stepResultMap = Object.fromEntries(feasibility.steps.map((r) => [r.stepId, r]))

  // Determine which components appear in the plan (including structural sources/successors)
  const planComponentIds = useMemo(() => {
    const ids = new Set<string>()
    for (const step of plan.steps) {
      if (step.type === 'state-transition') {
        ids.add(step.componentId)
      } else if (step.type === 'structural-merge') {
        step.sourceIds.forEach((id) => ids.add(id))
        ids.add(step.successorId)
      } else if (step.type === 'structural-split') {
        ids.add(step.sourceId)
        step.successorIds.forEach((id) => ids.add(id))
      }
    }
    return ids
  }, [plan.steps])

  const displayComponents = components.filter((c) => {
    if (!planComponentIds.has(c.id)) return false
    if (visibleComponentIds && !visibleComponentIds.includes(c.id)) return false
    return true
  })

  if (plan.steps.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        <p>This plan has no steps yet.</p>
        <p className="text-xs mt-1">Add steps in the editor panel.</p>
      </div>
    )
  }

  return (
    <ScrollArea className="w-full" style={{ maxHeight: 'calc(100vh - 180px)' }}>
      <div className="overflow-x-auto">
        <table className="border-collapse text-sm">
          <thead className="sticky top-0 bg-background z-10">
            <tr>
              <th className="border px-3 py-2 text-left text-xs font-semibold bg-muted/50 min-w-[130px]">
                Component
              </th>
              {plan.steps.map((step, i) => {
                const result = stepResultMap[step.id]
                const isSelected = step.id === selectedStepId
                const toggle = () => onSelectStep(step.id === selectedStepId ? null : step.id)

                if (step.type === 'structural-merge' || step.type === 'structural-split') {
                  return (
                    <StructuralStepHeader
                      key={step.id}
                      step={step}
                      index={i}
                      isSelected={isSelected}
                      onClick={toggle}
                      result={result}
                    />
                  )
                }

                // State-transition header
                return (
                  <th
                    key={step.id}
                    onClick={toggle}
                    className={cn(
                      'border px-2 py-1.5 text-xs font-medium cursor-pointer text-center bg-muted/50 min-w-[110px]',
                      result?.status === 'violation' && 'bg-red-50 text-red-700',
                      result?.status === 'unvalidated' && 'text-muted-foreground',
                      isSelected && 'bg-primary/10',
                    )}
                  >
                    <div>Step {i + 1}</div>
                    <div className="font-normal text-muted-foreground truncate max-w-[100px] text-center">
                      {components.find((c) => c.id === step.componentId)?.name ?? '—'}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {displayComponents.map((comp) => (
              <tr key={comp.id}>
                <td className="border px-3 py-2 text-xs font-medium bg-muted/20 sticky left-0">
                  {comp.name}
                </td>
                {plan.steps.map((step, stepIndex) => {
                  const result = stepResultMap[step.id]
                  const isSelected = step.id === selectedStepId
                  const toggle = () => onSelectStep(step.id === selectedStepId ? null : step.id)

                  // Lifecycle state BEFORE this step (to detect retirement)
                  const lifecycleBefore = simulatePlanUpTo(plan, components, stepIndex - 1)

                  if (step.type === 'structural-merge') {
                    let kind: StructuralCellKind = 'normal'
                    if (step.sourceIds.includes(comp.id)) {
                      kind = 'source-retiring'
                    } else if (step.successorId === comp.id) {
                      kind = 'successor-intro'
                    } else if (lifecycleBefore.retired.has(comp.id)) {
                      kind = 'suppressed'
                    }

                    const stateMap = getStateAtStep(plan, components, stepIndex)
                    const stateId = stateMap.get(comp.id) ?? comp.states[0]?.id ?? ''
                    const stateName = comp.states.find((s) => s.id === stateId)?.name ?? stateId

                    return (
                      <StructuralStepCell
                        key={step.id}
                        kind={kind}
                        stateName={stateName}
                        isSelected={isSelected}
                        onClick={toggle}
                        stepType="structural-merge"
                        result={result}
                      />
                    )
                  }

                  if (step.type === 'structural-split') {
                    let kind: StructuralCellKind = 'normal'
                    if (step.sourceId === comp.id) {
                      kind = 'source-retiring'
                    } else if (step.successorIds.includes(comp.id)) {
                      kind = 'successor-intro'
                    } else if (lifecycleBefore.retired.has(comp.id)) {
                      kind = 'suppressed'
                    }

                    const stateMap = getStateAtStep(plan, components, stepIndex)
                    const stateId = stateMap.get(comp.id) ?? comp.states[0]?.id ?? ''
                    const stateName = comp.states.find((s) => s.id === stateId)?.name ?? stateId

                    return (
                      <StructuralStepCell
                        key={step.id}
                        kind={kind}
                        stateName={stateName}
                        isSelected={isSelected}
                        onClick={toggle}
                        stepType="structural-split"
                        result={result}
                      />
                    )
                  }

                  // ── State-transition step ──────────────────────────────────
                  // If component is retired before this step, suppress
                  if (lifecycleBefore.retired.has(comp.id)) {
                    return (
                      <td
                        key={step.id}
                        className={cn(
                          'border px-2 py-1.5 text-xs min-w-[110px] bg-gray-50 cursor-pointer',
                          isSelected && 'ring-2 ring-inset ring-primary',
                        )}
                        onClick={toggle}
                      >
                        <span className="text-gray-300 select-none">—</span>
                      </td>
                    )
                  }

                  const stateMap = getStateAtStep(plan, components, stepIndex)
                  const stateId = stateMap.get(comp.id) ?? comp.states[0]?.id ?? ''
                  const stateName = comp.states.find((s) => s.id === stateId)?.name ?? stateId
                  const isTransition = step.componentId === comp.id

                  const releaseEntry = isTransition
                    ? releases.find(
                        (r) =>
                          r.componentId === comp.id &&
                          r.fromState === step.fromState &&
                          r.toState === step.toState,
                      )
                    : undefined

                  return (
                    <TimelineCell
                      key={step.id}
                      stateName={stateName}
                      isTransition={isTransition}
                      result={isTransition ? result : undefined}
                      releaseStatus={releaseEntry?.status === 'untracked' ? undefined : releaseEntry?.status}
                      isSelected={isSelected}
                      onClick={toggle}
                    />
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ScrollArea>
  )
}

export function FeasibilityLegend() {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-300 inline-block" />
        OK
      </span>
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-sm bg-green-100 border border-green-300 inline-block" />
        Released
      </span>
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-sm bg-blue-50 border border-blue-200 inline-block" />
        Implemented
      </span>
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-sm bg-red-100 border border-red-300 inline-block" />
        Violation
      </span>
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-200 inline-block opacity-60" />
        Unvalidated
      </span>
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-sm bg-purple-100 border border-purple-200 inline-block" />
        Merge
      </span>
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-sm bg-indigo-100 border border-indigo-200 inline-block" />
        Split
      </span>
    </div>
  )
}
