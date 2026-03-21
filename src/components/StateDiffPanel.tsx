import { useStore } from '@/store'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Component, DependencyEdge } from '@/types'

interface DiffPaneProps {
  title: string
  stateName: string
  component: Component
  stateId: string
  allEdges: DependencyEdge[]
  components: Component[]
  releaseStatus?: string
  colorClass: string
}

function DiffPane({
  title,
  stateName,
  component,
  stateId,
  allEdges,
  components,
  releaseStatus,
  colorClass,
}: DiffPaneProps) {
  // Edges where this component at this state is the source
  const outEdges = allEdges.filter(
    (e) => e.from === component.id && e.fromState === stateId,
  )
  // Edges where this component at this state is the target
  const inEdges = allEdges.filter(
    (e) => e.to === component.id && e.toState === stateId,
  )

  function edgeLabel(e: DependencyEdge, isOut: boolean) {
    if (isOut) {
      const toComp = components.find((c) => c.id === e.to)
      const toStateName = toComp?.states.find((s) => s.id === e.toState)?.name ?? e.toState
      return `→ ${toComp?.name} must be in "${toStateName}"`
    } else {
      const fromComp = components.find((c) => c.id === e.from)
      const fromStateName = fromComp?.states.find((s) => s.id === e.fromState)?.name ?? e.fromState
      return `← requires ${fromComp?.name} to be in "${fromStateName}"`
    }
  }

  return (
    <div className={cn('flex-1 rounded-lg border-2 p-3 space-y-2', colorClass)}>
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</div>
      <div className="font-mono text-sm font-bold">{stateName}</div>

      {releaseStatus && (
        <Badge variant={releaseStatus === 'released' ? 'success' : 'warning'} className="text-xs">
          {releaseStatus}
        </Badge>
      )}

      {(inEdges.length > 0 || outEdges.length > 0) ? (
        <div className="space-y-1 mt-2">
          {inEdges.map((e) => (
            <div key={e.id} className="text-xs bg-white/60 rounded px-2 py-0.5 border border-current/20">
              {edgeLabel(e, false)}
            </div>
          ))}
          {outEdges.map((e) => (
            <div key={e.id} className="text-xs bg-white/60 rounded px-2 py-0.5 border border-current/20">
              {edgeLabel(e, true)}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No dependency constraints</p>
      )}
    </div>
  )
}

interface Props {
  componentId: string
  fromStateId: string
  toStateId: string
  onClose: () => void
}

export function StateDiffPanel({ componentId, fromStateId, toStateId, onClose }: Props) {
  const components = useStore((s) => s.project.components)
  const dependencies = useStore((s) => s.project.dependencies)
  const releases = useStore((s) => s.project.releases)

  const component = components.find((c) => c.id === componentId)
  if (!component) return null

  const fromStateName = component.states.find((s) => s.id === fromStateId)?.name ?? fromStateId
  const toStateName = component.states.find((s) => s.id === toStateId)?.name ?? toStateId

  // Detect added/removed constraints
  const beforeInEdges = dependencies.filter((e) => e.to === componentId && e.toState === fromStateId)
  const afterInEdges = dependencies.filter((e) => e.to === componentId && e.toState === toStateId)

  const addedEdges = afterInEdges.filter(
    (e) => !beforeInEdges.some((b) => b.from === e.from && b.fromState === e.fromState),
  )
  const removedEdges = beforeInEdges.filter(
    (e) => !afterInEdges.some((a) => a.from === e.from && a.fromState === e.fromState),
  )

  const releaseEntry = releases.find(
    (r) => r.componentId === componentId && r.fromState === fromStateId && r.toState === toStateId,
  )

  return (
    <div className="border rounded-lg p-4 bg-card shadow space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">
          {component.name}: {fromStateName} → {toStateName}
        </h3>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onClose}>
          <X className="h-3 w-3" />
        </Button>
      </div>

      <div className="flex gap-3">
        <DiffPane
          title="Before"
          stateName={fromStateName}
          component={component}
          stateId={fromStateId}
          allEdges={dependencies}
          components={components}
          colorClass="border-gray-300 bg-gray-50"
        />
        <DiffPane
          title="After"
          stateName={toStateName}
          component={component}
          stateId={toStateId}
          allEdges={dependencies}
          components={components}
          releaseStatus={releaseEntry?.status !== 'untracked' ? releaseEntry?.status : undefined}
          colorClass="border-blue-300 bg-blue-50"
        />
      </div>

      {(addedEdges.length > 0 || removedEdges.length > 0) && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground">Constraint Changes</p>
          {addedEdges.map((e) => {
            const fromComp = components.find((c) => c.id === e.from)
            const fromStateName = fromComp?.states.find((s) => s.id === e.fromState)?.name ?? e.fromState
            return (
              <div key={e.id} className="text-xs bg-green-50 border border-green-300 rounded px-2 py-1 text-green-800">
                + Added: requires {fromComp?.name} to be in "{fromStateName}"
              </div>
            )
          })}
          {removedEdges.map((e) => {
            const fromComp = components.find((c) => c.id === e.from)
            const fromStateName = fromComp?.states.find((s) => s.id === e.fromState)?.name ?? e.fromState
            return (
              <div key={e.id} className="text-xs bg-red-50 border border-red-300 rounded px-2 py-1 text-red-800">
                − Removed: requires {fromComp?.name} to be in "{fromStateName}"
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
