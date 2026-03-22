import { useMemo } from 'react'
import { useStore } from '@/store'
import { simulatePlanMemo, getStateAtStep } from '@/lib/feasibility'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MigrationPlan, Component } from '@/types'

interface ComparisonCellProps {
  stateName: string
  isTransition: boolean
  status?: 'ok' | 'violation' | 'unvalidated'
  isDifferent?: boolean
}

function ComparisonCell({ stateName, isTransition, status, isDifferent }: ComparisonCellProps) {
  return (
    <td
      className={cn(
        'border px-2 py-1 text-xs min-w-[110px]',
        isTransition && status === 'ok' && 'bg-emerald-50',
        isTransition && status === 'violation' && 'bg-red-100',
        isTransition && status === 'unvalidated' && 'bg-gray-100 opacity-60',
        !isTransition && 'text-muted-foreground',
        isDifferent && 'ring-2 ring-inset ring-yellow-400',
      )}
    >
      <div className="flex items-center gap-1">
        {isDifferent && <span className="text-yellow-600 shrink-0">⚡</span>}
        <span className="truncate">{stateName}</span>
        {isTransition && status === 'violation' && <span className="text-red-500 shrink-0">✗</span>}
      </div>
    </td>
  )
}

function PlanTimelineBlock({
  plan,
  components,
  maxSteps,
  planIndex,
}: {
  plan: MigrationPlan
  components: Component[]
  maxSteps: number
  planIndex: number
}) {
  const dependencies = useStore((s) => s.project.dependencies)
  const feasibility = simulatePlanMemo(plan, dependencies, components)
  const stepResultMap = Object.fromEntries(feasibility.steps.map((r) => [r.stepId, r]))

  const planComponentIds = [...new Set(plan.steps.filter((s) => s.type === 'state-transition').map((s) => s.type === 'state-transition' ? s.componentId : ''))]
  const displayComponents = components.filter((c) => planComponentIds.includes(c.id))

  const planColors = ['border-blue-400', 'border-purple-400', 'border-orange-400', 'border-green-400']

  return (
    <div className={cn('border-2 rounded-lg overflow-hidden', planColors[planIndex % planColors.length])}>
      <div className="px-3 py-2 bg-muted/50 flex items-center gap-2">
        <span className="font-semibold text-sm">{plan.name}</span>
        {feasibility.feasible ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-destructive" />
        )}
        {!feasibility.feasible && (
          <Badge variant="error" className="text-xs">
            {feasibility.steps.filter((s) => s.status === 'violation').length} violations
          </Badge>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="border-collapse text-sm w-full">
          <thead>
            <tr className="bg-muted/30">
              <th className="border px-2 py-1 text-xs text-left font-medium min-w-[110px]">
                Component
              </th>
              {Array.from({ length: maxSteps }, (_, i) => (
                <th key={i} className="border px-2 py-1 text-xs font-medium text-center min-w-[90px]">
                  {i < plan.steps.length ? (
                    <div>
                      <div>Step {i + 1}</div>
                      <div className="font-normal text-muted-foreground text-xs">
                        {plan.steps[i]?.type === 'state-transition' ? components.find((c) => c.id === (plan.steps[i] as { componentId: string }).componentId)?.name ?? '—' : '—'}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayComponents.map((comp) => (
              <tr key={comp.id}>
                <td className="border px-2 py-1 text-xs font-medium bg-muted/10">{comp.name}</td>
                {Array.from({ length: maxSteps }, (_, stepIndex) => {
                  if (stepIndex >= plan.steps.length) {
                    return (
                      <td key={stepIndex} className="border px-2 py-1 text-xs bg-gray-50 text-muted-foreground text-center">
                        —
                      </td>
                    )
                  }
                  const step = plan.steps[stepIndex]
                  const stateMap = getStateAtStep(plan, components, stepIndex)
                  const stateId = stateMap.get(comp.id) ?? comp.states[0]?.id ?? ''
                  const stateName = comp.states.find((s) => s.id === stateId)?.name ?? stateId
                  const isTransition = step.type === 'state-transition' && step.componentId === comp.id
                  const result = isTransition ? stepResultMap[step.id] : undefined

                  return (
                    <ComparisonCell
                      key={stepIndex}
                      stateName={stateName}
                      isTransition={isTransition}
                      status={result?.status}
                    />
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function SideBySideTimeline() {
  const plans = useStore((s) => s.project.plans)
  const components = useStore((s) => s.project.components)
  const comparisonPlanIds = useStore((s) => s.comparisonPlanIds)

  const selectedPlans = useMemo(
    () => comparisonPlanIds.map((id) => plans.find((p) => p.id === id)).filter(Boolean) as MigrationPlan[],
    [plans, comparisonPlanIds],
  )

  if (selectedPlans.length < 2) {
    return (
      <div className="p-6 text-center text-muted-foreground text-sm">
        Select at least 2 plans from the selector above to compare.
      </div>
    )
  }

  const maxSteps = Math.max(...selectedPlans.map((p) => p.steps.length))

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {selectedPlans.map((plan, i) => (
          <PlanTimelineBlock
            key={plan.id}
            plan={plan}
            components={components}
            maxSteps={maxSteps}
            planIndex={i}
          />
        ))}
      </div>
    </ScrollArea>
  )
}
