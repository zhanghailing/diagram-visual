import { useStore } from '@/store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { ReleaseStatus } from '@/types'

const STATUS_ORDER: ReleaseStatus[] = ['untracked', 'implemented', 'released']

function nextStatus(current: ReleaseStatus): ReleaseStatus {
  const idx = STATUS_ORDER.indexOf(current)
  return STATUS_ORDER[(idx + 1) % STATUS_ORDER.length]
}

function StatusBadge({ status }: { status: ReleaseStatus }) {
  if (status === 'released') return <Badge variant="success">Released</Badge>
  if (status === 'implemented') return <Badge variant="warning">Implemented</Badge>
  return <Badge variant="outline" className="text-muted-foreground">Untracked</Badge>
}

export function ReleaseStatusPanel() {
  const components = useStore((s) => s.project.components)
  const plans = useStore((s) => s.project.plans)
  const releases = useStore((s) => s.project.releases)
  const setReleaseStatus = useStore((s) => s.setReleaseStatus)

  // Collect all unique transitions from all plans
  const transitionSet = new Map<string, { componentId: string; fromState: string; toState: string }>()
  for (const plan of plans) {
    for (const step of plan.steps) {
      const key = `${step.componentId}:${step.fromState}:${step.toState}`
      if (!transitionSet.has(key)) {
        transitionSet.set(key, {
          componentId: step.componentId,
          fromState: step.fromState,
          toState: step.toState,
        })
      }
    }
  }

  const transitions = [...transitionSet.values()]

  if (transitions.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground text-sm">
        <p>No transitions to track yet.</p>
        <p className="text-xs mt-1">Add steps to your migration plans first.</p>
      </div>
    )
  }

  function getReleaseStatus(componentId: string, fromState: string, toState: string): ReleaseStatus {
    return (
      releases.find(
        (r) => r.componentId === componentId && r.fromState === fromState && r.toState === toState,
      )?.status ?? 'untracked'
    )
  }

  // Group by component
  const byComponent = new Map<string, typeof transitions>()
  for (const t of transitions) {
    if (!byComponent.has(t.componentId)) byComponent.set(t.componentId, [])
    byComponent.get(t.componentId)!.push(t)
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {[...byComponent.entries()].map(([compId, compTransitions]) => {
          const comp = components.find((c) => c.id === compId)
          return (
            <div key={compId} className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                {comp?.name ?? compId}
                {comp && (
                  <Badge variant="outline" className="text-xs font-normal">
                    {comp.type}
                  </Badge>
                )}
              </h3>
              <div className="space-y-1 pl-2">
                {compTransitions.map((t) => {
                  const fromStateName =
                    comp?.states.find((s) => s.id === t.fromState)?.name ?? t.fromState
                  const toStateName =
                    comp?.states.find((s) => s.id === t.toState)?.name ?? t.toState
                  const status = getReleaseStatus(t.componentId, t.fromState, t.toState)

                  return (
                    <div
                      key={`${t.fromState}-${t.toState}`}
                      className="flex items-center justify-between gap-3 p-2 rounded-md border bg-card"
                    >
                      <span className="text-xs font-mono text-muted-foreground flex-1">
                        {fromStateName} → {toStateName}
                      </span>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={status} />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() =>
                            setReleaseStatus(t.componentId, t.fromState, t.toState, nextStatus(status))
                          }
                        >
                          {status === 'released' ? 'Reset' : status === 'implemented' ? 'Mark Released' : 'Mark Implemented'}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
