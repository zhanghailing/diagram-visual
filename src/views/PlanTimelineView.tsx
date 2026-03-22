import { useState } from 'react'
import { useStore } from '@/store'
import { PlanTimeline, FeasibilityLegend } from '@/components/PlanTimeline'
import { PlanStepEditor } from '@/components/PlanStepEditor'
import { StepDetailPanel } from '@/components/StepDetailPanel'
import { StateDiffPanel } from '@/components/StateDiffPanel'
import { Button } from '@/components/ui/button'
import { SplitSquareHorizontal, ListOrdered } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PlanTimelineView() {
  const plan = useStore((s) => s.project.plans.find((p) => p.id === s.activePlanId))
  const components = useStore((s) => s.project.components)
  const releases = useStore((s) => s.project.releases)
  const visibleComponentIds = useStore((s) => s.visibleComponentIds)
  const setVisibleComponentIds = useStore((s) => s.setVisibleComponentIds)
  const selectedStepId = useStore((s) => s.selectedStepId)
  const setSelectedStep = useStore((s) => s.setSelectedStep)

  const [mode, setMode] = useState<'timeline' | 'editor'>('timeline')
  const [showDiff, setShowDiff] = useState(false)

  if (!plan) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
        <div className="text-center">
          <p className="mb-2">No plan selected.</p>
          <p className="text-xs">Select or create a plan from the sidebar.</p>
        </div>
      </div>
    )
  }

  const selectedStep = plan.steps.find((s) => s.id === selectedStepId)

  // Only show StateDiffPanel for state-transition steps
  const isStateTransition = selectedStep?.type === 'state-transition'

  // Component filter — include all components that appear in any plan step
  const planComponentIds = new Set<string>()
  for (const step of plan.steps) {
    if (step.type === 'state-transition') planComponentIds.add(step.componentId)
    else if (step.type === 'structural-merge') {
      step.sourceIds.forEach((id) => planComponentIds.add(id))
      planComponentIds.add(step.successorId)
    } else if (step.type === 'structural-split') {
      planComponentIds.add(step.sourceId)
      step.successorIds.forEach((id) => planComponentIds.add(id))
    }
  }
  const planComponents = components.filter((c) => planComponentIds.has(c.id))

  return (
    <div className="h-full flex flex-col">
      {/* Header toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm">{plan.name}</h2>
          {plan.description && (
            <span className="text-xs text-muted-foreground">{plan.description}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <FeasibilityLegend />
          <div className="h-4 w-px bg-border mx-1" />
          <Button
            size="sm"
            variant={mode === 'timeline' ? 'secondary' : 'ghost'}
            onClick={() => setMode('timeline')}
          >
            <SplitSquareHorizontal className="h-4 w-4 mr-1" /> Timeline
          </Button>
          <Button
            size="sm"
            variant={mode === 'editor' ? 'secondary' : 'ghost'}
            onClick={() => setMode('editor')}
          >
            <ListOrdered className="h-4 w-4 mr-1" /> Editor
          </Button>
        </div>
      </div>

      {/* Component filter strip */}
      {planComponents.length > 0 && (
        <div className="flex items-center gap-1 px-4 py-1.5 border-b bg-muted/20 flex-wrap">
          <span className="text-xs text-muted-foreground mr-1">Filter:</span>
          <button
            onClick={() => setVisibleComponentIds(null)}
            className={cn(
              'text-xs px-2 py-0.5 rounded-full border transition-colors',
              visibleComponentIds === null
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border hover:bg-accent',
            )}
          >
            All
          </button>
          {planComponents.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                const planCompIdList = [...planComponentIds]
                if (visibleComponentIds === null) {
                  setVisibleComponentIds(planCompIdList.filter((id) => id !== c.id))
                } else if (visibleComponentIds.includes(c.id)) {
                  const next = visibleComponentIds.filter((id) => id !== c.id)
                  setVisibleComponentIds(next.length === 0 ? null : next)
                } else {
                  setVisibleComponentIds([...visibleComponentIds, c.id])
                }
              }}
              className={cn(
                'text-xs px-2 py-0.5 rounded-full border transition-colors',
                (visibleComponentIds === null || visibleComponentIds.includes(c.id))
                  ? 'bg-accent border-border'
                  : 'border-border opacity-40 hover:opacity-70',
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex gap-4 p-4">
        <div className="flex-1 overflow-hidden">
          {mode === 'timeline' ? (
            <PlanTimeline
              plan={plan}
              components={components}
              visibleComponentIds={visibleComponentIds}
              releases={releases}
              selectedStepId={selectedStepId}
              onSelectStep={setSelectedStep}
            />
          ) : (
            <div className="overflow-y-auto h-full">
              <PlanStepEditor planId={plan.id} />
            </div>
          )}
        </div>

        {/* Side panel */}
        {selectedStepId && selectedStep && (
          <div className="w-72 shrink-0 space-y-3 overflow-y-auto">
            <StepDetailPanel
              planId={plan.id}
              stepId={selectedStepId}
              onClose={() => setSelectedStep(null)}
            />
            {/* Only show diff button for state-transition steps */}
            {isStateTransition && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowDiff((v) => !v)}
                >
                  {showDiff ? 'Hide' : 'Show'} State Diff
                </Button>
                {showDiff && (
                  <StateDiffPanel
                    componentId={selectedStep.componentId}
                    fromStateId={selectedStep.fromState}
                    toStateId={selectedStep.toState}
                    onClose={() => setShowDiff(false)}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
