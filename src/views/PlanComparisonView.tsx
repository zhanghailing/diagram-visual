import { useStore } from '@/store'
import { simulatePlanMemo, getStateAtStep } from '@/lib/feasibility'
import { PlanComparisonSelector } from '@/components/PlanComparisonSelector'
import { SideBySideTimeline } from '@/components/SideBySideTimeline'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { MigrationPlan } from '@/types'

function OverlayView() {
  const plans = useStore((s) => s.project.plans)
  const components = useStore((s) => s.project.components)
  const dependencies = useStore((s) => s.project.dependencies)
  const comparisonPlanIds = useStore((s) => s.comparisonPlanIds)

  const planA = plans.find((p) => p.id === comparisonPlanIds[0]) as MigrationPlan | undefined
  const planB = plans.find((p) => p.id === comparisonPlanIds[1]) as MigrationPlan | undefined

  if (!planA || !planB) {
    return <p className="text-sm text-muted-foreground">Select 2 plans from above to see the overlay.</p>
  }

  // Suppress unused vars — feasibility used for future enhancement
  void simulatePlanMemo(planA, dependencies, components)
  void simulatePlanMemo(planB, dependencies, components)

  const allComponentIds = [...new Set([
    ...planA.steps.map((s) => s.componentId),
    ...planB.steps.map((s) => s.componentId),
  ])]
  const maxSteps = Math.max(planA.steps.length, planB.steps.length)
  const displayComponents = components.filter((c) => allComponentIds.includes(c.id))

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-xs">
        <thead>
          <tr>
            <th className="border px-2 py-1.5 text-left bg-muted/50 min-w-[110px]">Component</th>
            {Array.from({ length: maxSteps }, (_, i) => (
              <th key={i} className="border px-2 py-1.5 text-center bg-muted/50 min-w-[140px]">
                Step {i + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayComponents.map((comp) => (
            <tr key={comp.id}>
              <td className="border px-2 py-1.5 font-medium bg-muted/10">{comp.name}</td>
              {Array.from({ length: maxSteps }, (_, si) => {
                const stateA = si < planA.steps.length ? getStateAtStep(planA, components, si).get(comp.id) : null
                const stateB = si < planB.steps.length ? getStateAtStep(planB, components, si).get(comp.id) : null
                const nameA = stateA ? comp.states.find((s) => s.id === stateA)?.name ?? stateA : '—'
                const nameB = stateB ? comp.states.find((s) => s.id === stateB)?.name ?? stateB : '—'
                const differs = nameA !== nameB

                return (
                  <td key={si} className={`border px-2 py-1.5 ${differs ? 'bg-yellow-50' : ''}`}>
                    {differs ? (
                      <div className="space-y-0.5">
                        <div className="text-blue-700">{planA.name.slice(0, 10)}: <span className="font-medium">{nameA}</span></div>
                        <div className="text-purple-700">{planB.name.slice(0, 10)}: <span className="font-medium">{nameB}</span></div>
                      </div>
                    ) : (
                      <span className={nameA === '—' ? 'text-muted-foreground' : ''}>{nameA}</span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function PlanComparisonView() {
  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b">
        <h2 className="font-semibold text-sm mb-3">Compare Plans</h2>
        <PlanComparisonSelector />
      </div>

      <Tabs defaultValue="side-by-side" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 pt-2 border-b">
          <TabsList className="h-8">
            <TabsTrigger value="side-by-side" className="text-xs">Side by Side</TabsTrigger>
            <TabsTrigger value="overlay" className="text-xs">Overlay</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="side-by-side" className="flex-1 overflow-hidden mt-0">
          <SideBySideTimeline />
        </TabsContent>
        <TabsContent value="overlay" className="flex-1 overflow-auto mt-0 p-4">
          <p className="text-xs text-muted-foreground mb-3">
            Overlay mode: differences between the first two selected plans are highlighted in yellow.
          </p>
          <OverlayView />
        </TabsContent>
      </Tabs>
    </div>
  )
}
