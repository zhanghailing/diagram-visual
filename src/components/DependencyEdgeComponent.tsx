import { memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
  type EdgeProps,
} from '@xyflow/react'
import { useStore } from '@/store'
import { cn } from '@/lib/utils'

interface DependencyEdgeData {
  fromState: string
  toState: string
  fromStateName: string
  toStateName: string
  edgeId: string
}

export const DependencyEdgeComponent = memo(function DependencyEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  selected,
}: EdgeProps & { data: DependencyEdgeData }) {
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  })

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
          strokeWidth: selected ? 2 : 1.5,
        }}
        markerEnd="url(#arrowhead)"
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className={cn(
            'px-2 py-0.5 rounded text-xs border bg-white shadow-sm whitespace-nowrap nodrag nopan',
            selected ? 'border-primary text-primary' : 'border-border text-muted-foreground',
          )}
        >
          {data?.fromStateName} → {data?.toStateName}
        </div>
      </EdgeLabelRenderer>
    </>
  )
})

export function useDependencyEdgeData() {
  const components = useStore((s) => s.project.components)
  const dependencies = useStore((s) => s.project.dependencies)

  return dependencies.map((dep) => {
    const fromComp = components.find((c) => c.id === dep.from)
    const toComp = components.find((c) => c.id === dep.to)
    const fromStateName =
      fromComp?.states.find((s) => s.id === dep.fromState)?.name ?? dep.fromState
    const toStateName = toComp?.states.find((s) => s.id === dep.toState)?.name ?? dep.toState

    return {
      id: dep.id,
      source: dep.from,
      target: dep.to,
      type: 'dependency',
      data: {
        fromState: dep.fromState,
        toState: dep.toState,
        fromStateName,
        toStateName,
        edgeId: dep.id,
      },
    }
  })
}
