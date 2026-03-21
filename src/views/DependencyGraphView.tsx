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
  const components = useStore((s) => s.project.components)
  const dependencies = useStore((s) => s.project.dependencies)
  const nodePositions = useStore((s) => s.nodePositions)
  const setNodePosition = useStore((s) => s.setNodePosition)
  const selectedEdgeId = useStore((s) => s.selectedEdgeId)
  const setSelectedEdge = useStore((s) => s.setSelectedEdge)
  const deleteDependencyEdge = useStore((s) => s.deleteDependencyEdge)

  const [showAddEdge, setShowAddEdge] = useState(false)

  const rawNodes: Node[] = useMemo(
    () =>
      components.map((c) => ({
        id: c.id,
        type: 'component',
        position: nodePositions[c.id] ?? { x: 0, y: 0 },
        data: c as unknown as Record<string, unknown>,
      })),
    [components, nodePositions],
  )

  const rawEdges: Edge[] = useMemo(
    () =>
      dependencies.map((dep) => {
        const fromComp = components.find((c) => c.id === dep.from)
        const toComp = components.find((c) => c.id === dep.to)
        const fromStateName = fromComp?.states.find((s) => s.id === dep.fromState)?.name ?? dep.fromState
        const toStateName = toComp?.states.find((s) => s.id === dep.toState)?.name ?? dep.toState
        return {
          id: dep.id,
          source: dep.from,
          target: dep.to,
          type: 'dependency',
          selected: dep.id === selectedEdgeId,
          data: { fromStateName, toStateName, edgeId: dep.id } as unknown as Record<string, unknown>,
          markerEnd: { type: 'arrowclosed' as never },
        }
      }),
    [dependencies, components, selectedEdgeId],
  )

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

  if (components.length === 0) {
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
