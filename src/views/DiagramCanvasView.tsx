import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  type EdgeTypes,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useStore } from '@/store'
import type { Diagram, PhaseId, DiagramNodeBase, DiagramEdgeBase } from '@/types'
import { generateId } from '@/lib/utils'
import { PhaseSwitcher } from '@/components/PhaseSwitcher'
import { DiagramPalette } from '@/components/DiagramPalette'
import { NodePropertiesPanel } from '@/components/NodePropertiesPanel'
import { MermaidImportDialog } from '@/components/MermaidImportDialog'
import { C4PersonNode } from '@/components/diagram-nodes/C4PersonNode'
import { C4SystemNode } from '@/components/diagram-nodes/C4SystemNode'
import { C4ContainerNode } from '@/components/diagram-nodes/C4ContainerNode'
import { C4ComponentNode } from '@/components/diagram-nodes/C4ComponentNode'
import { BoxNode } from '@/components/diagram-nodes/BoxNode'
import { DatabaseNode } from '@/components/diagram-nodes/DatabaseNode'
import { ActorNode } from '@/components/diagram-nodes/ActorNode'
import { QueueNode } from '@/components/diagram-nodes/QueueNode'
import { RelEdge } from '@/components/diagram-nodes/RelEdge'
import { resolveDiagramPhase } from '@/lib/diagram-phase'
import { applyDagreLayout } from '@/lib/diagram-layout'
import { Button } from '@/components/ui/button'
import { Layout, Upload } from 'lucide-react'

const NODE_TYPES: NodeTypes = {
  'c4-person': C4PersonNode as never,
  'c4-system': C4SystemNode as never,
  'c4-container': C4ContainerNode as never,
  'c4-component': C4ComponentNode as never,
  box: BoxNode as never,
  database: DatabaseNode as never,
  actor: ActorNode as never,
  queue: QueueNode as never,
}

const EDGE_TYPES: EdgeTypes = {
  rel: RelEdge as never,
}

interface DiagramCanvasViewProps {
  diagram: Diagram
}

export function DiagramCanvasView({ diagram }: DiagramCanvasViewProps) {
  const updateDiagramElement = useStore((s) => s.updateDiagramElement)
  const setDiagramNodePosition = useStore((s) => s.setDiagramNodePosition)

  const [activePhase, setActivePhase] = useState<PhaseId>('as-is')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [showImportDialog, setShowImportDialog] = useState(false)

  // Resolve elements for the active phase (inheritance + overrides)
  const resolved = useMemo(() => resolveDiagramPhase(diagram, activePhase), [diagram, activePhase])

  const rfNodes: Node[] = useMemo(
    () =>
      resolved.nodes.map((n) => ({
        id: n.id,
        type: n.nodeType,
        position: n.position,
        data: { label: n.label, description: n.description, nodeType: n.nodeType },
        selected: n.id === selectedNodeId,
      })),
    [resolved.nodes, selectedNodeId],
  )

  const rfEdges: Edge[] = useMemo(
    () =>
      resolved.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: diagram.type === 'c4-component' ? 'rel' : 'default',
        label: e.label,
        data: { technology: e.technology },
      })),
    [resolved.edges, diagram.type],
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(rfNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(rfEdges)

  // Sync when diagram data changes externally
  useEffect(() => {
    setNodes(rfNodes)
  }, [rfNodes, setNodes])

  useEffect(() => {
    setEdges(rfEdges)
  }, [rfEdges, setEdges])

  const onConnect = useCallback(
    (connection: Connection) => {
      const edge: DiagramEdgeBase = {
        id: generateId(),
        source: connection.source,
        target: connection.target,
        label: '',
      }
      updateDiagramElement(diagram.id, activePhase, { kind: 'add-edge', edge })
      setEdges((eds) => addEdge({ ...connection, id: edge.id, type: diagram.type === 'c4-component' ? 'rel' : 'default' }, eds))
    },
    [diagram.id, diagram.type, activePhase, updateDiagramElement, setEdges],
  )

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setDiagramNodePosition(diagram.id, activePhase, node.id, node.position, true)
    },
    [diagram.id, activePhase, setDiagramNodePosition],
  )

  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      for (const node of deleted) {
        updateDiagramElement(diagram.id, activePhase, { kind: 'remove-node', nodeId: node.id })
      }
    },
    [diagram.id, activePhase, updateDiagramElement],
  )

  const onEdgesDelete = useCallback(
    (deleted: Edge[]) => {
      for (const edge of deleted) {
        updateDiagramElement(diagram.id, activePhase, { kind: 'remove-edge', edgeId: edge.id })
      }
    },
    [diagram.id, activePhase, updateDiagramElement],
  )

  function handleAddNode(nodeType: string, label: string) {
    const node: DiagramNodeBase = {
      id: generateId(),
      nodeType,
      label,
      position: { x: 200 + Math.random() * 200, y: 200 + Math.random() * 200 },
      manuallyPositioned: false,
    }
    updateDiagramElement(diagram.id, activePhase, { kind: 'add-node', node })
  }

  function handleRelayout() {
    const laidOut = applyDagreLayout(nodes, edges, false)
    setNodes(laidOut)
    for (const n of laidOut) {
      setDiagramNodePosition(diagram.id, activePhase, n.id, n.position, false)
    }
  }

  function handleImportNodes(newNodes: DiagramNodeBase[], newEdges: DiagramEdgeBase[]) {
    for (const n of newNodes) {
      updateDiagramElement(diagram.id, activePhase, { kind: 'add-node', node: n })
    }
    for (const e of newEdges) {
      updateDiagramElement(diagram.id, activePhase, { kind: 'add-edge', edge: e })
    }
    setShowImportDialog(false)
  }

  const selectedNode = resolved.nodes.find((n) => n.id === selectedNodeId) ?? null

  return (
    <div className="flex h-full">
      {/* Palette */}
      <DiagramPalette diagramType={diagram.type} onAddNode={handleAddNode} />

      {/* Canvas */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-3 py-2 border-b bg-card shrink-0">
          <span className="font-medium text-sm">{diagram.name}</span>
          <span className="text-xs text-muted-foreground bg-accent px-1.5 py-0.5 rounded capitalize">
            {diagram.type.replace('-', ' ')}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <PhaseSwitcher activePhase={activePhase} onChange={setActivePhase} />
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleRelayout}>
              <Layout className="h-3 w-3 mr-1" /> Re-layout All
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowImportDialog(true)}>
              <Upload className="h-3 w-3 mr-1" /> Import Mermaid
            </Button>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={NODE_TYPES}
            edgeTypes={EDGE_TYPES}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStop={onNodeDragStop}
            onNodesDelete={onNodesDelete}
            onEdgesDelete={onEdgesDelete}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId(null)}
            deleteKeyCode={['Delete', 'Backspace']}
            fitView
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
      </div>

      {/* Properties panel */}
      {selectedNode && (
        <NodePropertiesPanel
          node={selectedNode}
          diagramId={diagram.id}
          phase={activePhase}
          onClose={() => setSelectedNodeId(null)}
        />
      )}

      {showImportDialog && (
        <MermaidImportDialog
          diagramType={diagram.type}
          onImport={handleImportNodes}
          onClose={() => setShowImportDialog(false)}
        />
      )}
    </div>
  )
}
