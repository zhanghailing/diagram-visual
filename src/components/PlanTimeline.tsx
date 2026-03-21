import { useMemo } from 'react'
import { useStore } from '@/store'
import { simulatePlanMemo, getStateAtStep } from '@/lib/feasibility'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { MigrationPlan, Component, StepResult, ReleaseEntry } from '@/types'

interface CellProps {
  stateName: string
  isTransition: boolean
  result?: StepResult
  releaseStatus?: 'implemented' | 'released'
  isSelected: boolean
  onClick: () => void
  stepIndex: number
}

function TimelineCell({
  stateName,
  isTransition,
  result,
  releaseStatus,
  isSelected,
  onClick,
  stepIndex: _stepIndex,
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

  // Determine which components appear in the plan
  const planComponentIds = useMemo(
    () => [...new Set(plan.steps.map((s) => s.componentId))],
    [plan.steps],
  )
  const displayComponents = components.filter((c) => {
    if (!planComponentIds.includes(c.id)) return false
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
                return (
                  <th
                    key={step.id}
                    onClick={() => onSelectStep(step.id === selectedStepId ? null : step.id)}
                    className={cn(
                      'border px-2 py-1.5 text-xs font-medium cursor-pointer text-center bg-muted/50 min-w-[110px]',
                      result?.status === 'violation' && 'bg-red-50 text-red-700',
                      result?.status === 'unvalidated' && 'text-muted-foreground',
                      step.id === selectedStepId && 'bg-primary/10',
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
                      result={isTransition ? stepResultMap[step.id] : undefined}
                      releaseStatus={releaseEntry?.status === 'untracked' ? undefined : releaseEntry?.status}
                      isSelected={step.id === selectedStepId}
                      onClick={() => onSelectStep(step.id === selectedStepId ? null : step.id)}
                      stepIndex={stepIndex}
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
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
    </div>
  )
}
