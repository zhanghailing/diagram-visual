import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  useNodesState,
  useEdgesState,
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
import { EdgePropertiesPanel } from '@/components/EdgePropertiesPanel'
import { MermaidImportDialog } from '@/components/MermaidImportDialog'
import { PhaseEditorPopover } from '@/components/PhaseEditorPopover'
import { C4PersonNode } from '@/components/diagram-nodes/C4PersonNode'
import { C4SystemNode } from '@/components/diagram-nodes/C4SystemNode'
import { C4ContainerNode } from '@/components/diagram-nodes/C4ContainerNode'
import { C4ComponentNode } from '@/components/diagram-nodes/C4ComponentNode'
import { BoxNode } from '@/components/diagram-nodes/BoxNode'
import { DatabaseNode } from '@/components/diagram-nodes/DatabaseNode'
import { ActorNode } from '@/components/diagram-nodes/ActorNode'
import { QueueNode } from '@/components/diagram-nodes/QueueNode'
import { RelEdge } from '@/components/diagram-nodes/RelEdge'
import { resolveDiagramPhase, resolvedPhaseToMermaid, getPhaseOrder } from '@/lib/diagram-phase'
import { applyDagreLayout } from '@/lib/diagram-layout'
import { exportCanvasToPng, capturePng, downloadZip, toSafeFilename } from '@/lib/project-io'
import { Button } from '@/components/ui/button'
import { Layout, Upload, Download, ChevronDown } from 'lucide-react'

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

  const phases = getPhaseOrder(diagram)
  const [activePhase, setActivePhase] = useState<PhaseId>(phases[0]?.id ?? 'as-is')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [copiedMermaid, setCopiedMermaid] = useState(false)
  const [exportingZip, setExportingZip] = useState(false)
  const canvasContainerRef = useRef<HTMLDivElement>(null)

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
        // Inline stroke so html-to-image captures it without relying on CSS variables
        style: { stroke: '#374151', strokeWidth: 1.5 },
        markerEnd: diagram.type !== 'c4-component'
          ? { type: MarkerType.ArrowClosed, color: '#374151' }
          : undefined,
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

  // Reset active phase to first when the active phase is deleted
  useEffect(() => {
    const ids = getPhaseOrder(diagram).map((p) => p.id)
    if (!ids.includes(activePhase)) {
      setActivePhase(ids[0] ?? 'as-is')
    }
  }, [diagram, activePhase])

  const onConnect = useCallback(
    (connection: Connection) => {
      const edge: DiagramEdgeBase = {
        id: generateId(),
        source: connection.source,
        target: connection.target,
        label: '',
      }
      updateDiagramElement(diagram.id, activePhase, { kind: 'add-edge', edge })
    },
    [diagram.id, activePhase, updateDiagramElement],
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
  const selectedEdge = resolved.edges.find((e) => e.id === selectedEdgeId) ?? null

  async function handleExportPng() {
    setExportMenuOpen(false)
    const el = canvasContainerRef.current
    if (!el) return
    const safeDiagram = toSafeFilename(diagram.name)
    await exportCanvasToPng(el, `${safeDiagram}-${activePhase}.png`)
  }

  async function handleCopyMermaid() {
    setExportMenuOpen(false)
    const mermaid = resolvedPhaseToMermaid(resolved)
    await navigator.clipboard.writeText(mermaid)
    setCopiedMermaid(true)
    setTimeout(() => setCopiedMermaid(false), 2000)
  }

  async function handleExportAllZip() {
    setExportMenuOpen(false)
    const el = canvasContainerRef.current
    if (!el) return
    setExportingZip(true)
    try {
      const safeDiagram = toSafeFilename(diagram.name)
      const savedPhase = activePhase
      const files: Array<{ name: string; blob: Blob }> = []

      for (const phase of phases.map((p) => p.id)) {
        setActivePhase(phase)
        // Let React re-render the new phase before capturing
        await new Promise<void>((resolve) => setTimeout(resolve, 300))
        const blob = await capturePng(el)
        files.push({ name: `${safeDiagram}-${phase}.png`, blob })
      }

      setActivePhase(savedPhase)
      await downloadZip(files, `${safeDiagram}-all-phases.zip`)
    } finally {
      setExportingZip(false)
    }
  }

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
            <PhaseSwitcher phases={phases} activePhase={activePhase} onChange={setActivePhase} />
            <PhaseEditorPopover diagramId={diagram.id} phases={phases} />
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleRelayout}>
              <Layout className="h-3 w-3 mr-1" /> Re-layout All
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowImportDialog(true)}>
              <Upload className="h-3 w-3 mr-1" /> Import Mermaid
            </Button>
            {/* Export dropdown */}
            <div className="relative">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => setExportMenuOpen((o) => !o)}
                disabled={exportingZip}
              >
                <Download className="h-3 w-3 mr-1" />
                {exportingZip ? 'Exporting…' : 'Export'}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
              {exportMenuOpen && (
                <>
                  {/* Click-away overlay */}
                  <div className="fixed inset-0 z-10" onClick={() => setExportMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 w-52 rounded-md border bg-popover shadow-md text-xs">
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 hover:bg-accent rounded-t-md"
                      onClick={handleExportPng}
                    >
                      <Download className="h-3 w-3" /> Export PNG (current phase)
                    </button>
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 hover:bg-accent"
                      onClick={handleCopyMermaid}
                    >
                      <Download className="h-3 w-3" />
                      {copiedMermaid ? 'Copied!' : 'Copy Mermaid (clipboard)'}
                    </button>
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 hover:bg-accent rounded-b-md"
                      onClick={handleExportAllZip}
                    >
                      <Download className="h-3 w-3" /> Export All Phases (ZIP)
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0" ref={canvasContainerRef}>
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
            onNodeClick={(_, node) => { setSelectedNodeId(node.id); setSelectedEdgeId(null) }}
            onEdgeClick={(_, edge) => { setSelectedEdgeId(edge.id); setSelectedNodeId(null) }}
            onPaneClick={() => { setSelectedNodeId(null); setSelectedEdgeId(null) }}
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
          phaseLabel={phases.find((p) => p.id === activePhase)?.label ?? activePhase}
          onClose={() => setSelectedNodeId(null)}
        />
      )}
      {selectedEdge && (
        <EdgePropertiesPanel
          edge={selectedEdge}
          diagramId={diagram.id}
          phase={activePhase}
          phaseLabel={phases.find((p) => p.id === activePhase)?.label ?? activePhase}
          onClose={() => setSelectedEdgeId(null)}
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
