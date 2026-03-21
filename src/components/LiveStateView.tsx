import { useMemo } from 'react'
import { useStore } from '@/store'
import { Badge } from '@/components/ui/badge'

export function LiveStateView() {
  const components = useStore((s) => s.project.components)
  const releases = useStore((s) => s.project.releases)

  const liveStates = useMemo(() => {
    const stateMap = new Map<string, string>()

    // Start at first state for each component
    for (const c of components) {
      if (c.states.length > 0) stateMap.set(c.id, c.states[0].id)
    }

    // Apply all "released" transitions in state-order
    const releasedTransitions = releases.filter((r) => r.status === 'released')
    for (const t of releasedTransitions) {
      stateMap.set(t.componentId, t.toState)
    }

    return stateMap
  }, [components, releases])

  if (components.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground text-sm">
        No components defined yet.
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3">
      <p className="text-xs text-muted-foreground mb-3">
        Current live state derived from all released transitions.
      </p>
      <div className="grid gap-2">
        {components.map((comp) => {
          const stateId = liveStates.get(comp.id)
          const stateName = comp.states.find((s) => s.id === stateId)?.name ?? stateId
          const isInitial = stateId === comp.states[0]?.id
          const isFinal = stateId === comp.states[comp.states.length - 1]?.id

          return (
            <div
              key={comp.id}
              className="flex items-center justify-between p-3 border rounded-lg bg-card"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{comp.name}</span>
                <Badge variant="outline" className="text-xs">{comp.type}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                  {stateName}
                </span>
                {isFinal && <Badge variant="success" className="text-xs">Migrated</Badge>}
                {isInitial && <Badge variant="muted" className="text-xs">Not started</Badge>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
