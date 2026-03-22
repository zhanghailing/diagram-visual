import { useCallback, useMemo, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from 'dagre'
import { useStore } from '@/store'
import { simulatePlanUpTo } from '@/lib/plan-simulation'
import { ComponentNode } from '@/components/ComponentNode'
import { DependencyEdgeComponent } from '@/components/DependencyEdgeComponent'
import { AddEdgePanel } from '@/components/AddEdgePanel'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Layout } from 'lucide-react'

const NODE_TYPES = { component: ComponentNode as never }
const EDGE_TYPES = { dependency: DependencyEdgeComponent as never }
const NODE_WIDTH = 220
const NODE_HEIGHT = 140

function getDagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 80 })
  nodes.forEach((n) => g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }))
  edges.forEach((e) => g.setEdge(e.source, e.target))
  dagre.layout(g)
  return nodes.map((n) => {
    const pos = g.node(n.id)
    return { ...n, position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 } }
  })
}

export function DependencyGraphView() {
  const allComponents = useStore((s) => s.project.components)
  const dependencies = useStore((s) => s.project.dependencies)
  const nodePositions = useStore((s) => s.nodePositions)
  const setNodePosition = useStore((s) => s.setNodePosition)
  const selectedEdgeId = useStore((s) => s.selectedEdgeId)
  const setSelectedEdge = useStore((s) => s.setSelectedEdge)
  const deleteDependencyEdge = useStore((s) => s.deleteDependencyEdge)

  // For topology-aware rendering (tasks 8.1–8.5)
  const selectedStepId = useStore((s) => s.selectedStepId)
  const activePlan = useStore((s) => s.project.plans.find((p) => p.id === s.activePlanId))

  const [showAddEdge, setShowAddEdge] = useState(false)

  // Compute lifecycle state at the selected step (task 8.2)
  const lifecycle = useMemo(() => {
    if (!activePlan || !selectedStepId) return null
    const stepIndex = activePlan.steps.findIndex((s) => s.id === selectedStepId)
    if (stepIndex === -1) return null
    return simulatePlanUpTo(activePlan, allComponents, stepIndex)
  }, [activePlan, selectedStepId, allComponents])

  // Determine which components to show (task 8.3, 8.4):
  // - If no step selected: show all registered components
  // - If a step is selected: show all active + retired components at that step
  const components = useMemo(() => {
    if (!lifecycle) return allComponents
    // Show all components that are either active OR retired at this step
    // (retired ones get a visual style applied below)
    return allComponents.filter(
      (c) => lifecycle.active.has(c.id) || lifecycle.retired.has(c.id),
    )
  }, [allComponents, lifecycle])

  const rawNodes: Node[] = useMemo(
    () =>
      components.map((c) => {
        const isRetired = lifecycle?.retired.has(c.id) ?? false
        const isSuccessor = !!c.migrationCreated && (lifecycle?.active.has(c.id) ?? false)
        return {
          id: c.id,
          type: 'component',
          position: nodePositions[c.id] ?? { x: 0, y: 0 },
          data: {
            ...c,
            isRetired,
            isSuccessor,
          } as unknown as Record<string, unknown>,
          // CSS transition for animation (task 8.6)
          style: {
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            opacity: isRetired ? 0.4 : 1,
          },
        }
      }),
    [components, nodePositions, lifecycle],
  )

  // Build redirected edges (task 8.5):
  // For edges targeting retired components, create a dashed redirect edge to the successor
  const rawEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = []

    for (const dep of dependencies) {
      const fromComp = allComponents.find((c) => c.id === dep.from)
      const toComp = allComponents.find((c) => c.id === dep.to)
      const fromStateName = fromComp?.states.find((s) => s.id === dep.fromState)?.name ?? dep.fromState
      const toStateName = toComp?.states.find((s) => s.id === dep.toState)?.name ?? dep.toState

      // Check if either endpoint is retired and should be redirected
      let actualFrom = dep.from
      let actualTo = dep.to
      let isRedirected = false

      if (lifecycle) {
        const fromSuccessor = lifecycle.successorMap.get(dep.from)
        if (fromSuccessor) {
          actualFrom = Array.isArray(fromSuccessor) ? fromSuccessor[0] : fromSuccessor
          isRedirected = true
        }
        const toSuccessor = lifecycle.successorMap.get(dep.to)
        if (toSuccessor) {
          actualTo = Array.isArray(toSuccessor) ? toSuccessor[0] : toSuccessor
          isRedirected = true
        }
      }

      // Skip edges where both endpoints don't exist in the current node set
      const nodeIds = new Set(components.map((c) => c.id))
      const fromVisible = nodeIds.has(actualFrom) || nodeIds.has(dep.from)
      const toVisible = nodeIds.has(actualTo) || nodeIds.has(dep.to)
      if (!fromVisible || !toVisible) continue

      edges.push({
        id: dep.id,
        source: isRedirected ? actualFrom : dep.from,
        target: isRedirected ? actualTo : dep.to,
        type: 'dependency',
        selected: dep.id === selectedEdgeId,
        data: {
          fromStateName,
          toStateName,
          edgeId: dep.id,
          isRedirected,
        } as unknown as Record<string, unknown>,
        markerEnd: { type: 'arrowclosed' as never },
        style: isRedirected ? { strokeDasharray: '5,5', opacity: 0.7 } : undefined,
        label: isRedirected ? '↺ redirected' : undefined,
      })
    }

    return edges
  }, [dependencies, allComponents, components, selectedEdgeId, lifecycle])

  const [nodes, setNodes, onNodesChange] = useNodesState(rawNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(rawEdges)

  // Sync nodes from store when components change
  useMemo(() => {
    setNodes(rawNodes)
  }, [rawNodes])
  useMemo(() => {
    setEdges(rawEdges)
  }, [rawEdges])

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setNodePosition(node.id, node.position)
    },
    [setNodePosition],
  )

  function applyAutoLayout() {
    const laidOut = getDagreLayout(nodes, edges)
    laidOut.forEach((n) => setNodePosition(n.id, n.position))
    setNodes(laidOut)
  }

  if (allComponents.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
        <div className="text-center">
          <p className="mb-2">No components yet.</p>
          <p className="text-xs">Add components using the sidebar to get started.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full relative">
      {/* Topology context indicator */}
      {lifecycle && (
        <div className="absolute top-2 left-2 z-10 bg-background/90 border rounded-md px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
          Showing topology at selected step
          {lifecycle.retired.size > 0 && (
            <span className="ml-2 text-amber-700">
              · {lifecycle.retired.size} retired
            </span>
          )}
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onEdgeClick={(_, edge) => setSelectedEdge(edge.id === selectedEdgeId ? null : edge.id)}
        onPaneClick={() => setSelectedEdge(null)}
        fitView
        attributionPosition="bottom-right"
      >
        <Background />
        <Controls />
        <MiniMap />
        <Panel position="top-right" className="flex flex-col gap-2">
          <Button
            size="sm"
            onClick={() => setShowAddEdge((v) => !v)}
            variant={showAddEdge ? 'secondary' : 'default'}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Edge
          </Button>
          {selectedEdgeId && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => deleteDependencyEdge(selectedEdgeId)}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete Edge
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={applyAutoLayout}>
            <Layout className="h-4 w-4 mr-1" /> Auto Layout
          </Button>
        </Panel>
      </ReactFlow>

      {showAddEdge && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-[480px]">
          <AddEdgePanel onClose={() => setShowAddEdge(false)} />
        </div>
      )}
    </div>
  )
}
