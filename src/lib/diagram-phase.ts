import type { Diagram, DiagramPhase, PhaseId, DiagramNodeBase, DiagramEdgeBase } from '@/types'

// ─── Mermaid export ───────────────────────────────────────────────────────────

function sanitizeMermaidId(id: string): string {
  // UUID hyphens are invalid in Mermaid node IDs — prefix with 'n' and strip hyphens
  return 'n' + id.replace(/-/g, '')
}

function escapeMermaidLabel(label: string): string {
  // Replace characters that would break Mermaid label syntax
  return label.replace(/"/g, '#quot;').replace(/\[/g, '(').replace(/\]/g, ')')
}

/**
 * Converts a resolved phase (nodes + edges) to Mermaid `flowchart LR` syntax.
 * Suitable for pasting into a Confluence Mermaid macro.
 */
export function resolvedPhaseToMermaid(phase: ResolvedPhase): string {
  const lines: string[] = ['flowchart LR']

  for (const node of phase.nodes) {
    const safeId = sanitizeMermaidId(node.id)
    const label = escapeMermaidLabel(node.label)
    lines.push(`  ${safeId}[${label}]`)
  }

  for (const edge of phase.edges) {
    const srcId = sanitizeMermaidId(edge.source)
    const tgtId = sanitizeMermaidId(edge.target)
    if (edge.label) {
      const label = escapeMermaidLabel(edge.label)
      lines.push(`  ${srcId} -->|${label}| ${tgtId}`)
    } else {
      lines.push(`  ${srcId} --> ${tgtId}`)
    }
  }

  return lines.join('\n')
}

const DEFAULT_PHASES: DiagramPhase[] = [
  { id: 'as-is', label: 'As-Is' },
  { id: 'phase-1', label: 'Phase 1' },
  { id: 'phase-2', label: 'Phase 2' },
]

export function getPhaseOrder(diagram: Diagram): DiagramPhase[] {
  return diagram.phaseOrder && diagram.phaseOrder.length > 0 ? diagram.phaseOrder : DEFAULT_PHASES
}

export interface ResolvedPhase {
  nodes: DiagramNodeBase[]
  edges: DiagramEdgeBase[]
}

/**
 * Resolves the visible elements for a given phase by applying inheritance
 * and per-phase overrides on top of the base (as-is) elements.
 */
export function resolveDiagramPhase(diagram: Diagram, targetPhase: PhaseId): ResolvedPhase {
  // Start with base elements
  let nodes: DiagramNodeBase[] = [...diagram.baseNodes]
  let edges: DiagramEdgeBase[] = [...diagram.baseEdges]

  // Walk through phases in order up to and including the target
  const phaseOrder = getPhaseOrder(diagram)
  const phaseIndex = phaseOrder.findIndex((p) => p.id === targetPhase)
  for (let i = 1; i <= phaseIndex; i++) {
    const phaseId = phaseOrder[i].id
    const phaseState = diagram.phases[phaseId]
    if (!phaseState) continue

    // Add new elements introduced in this phase
    nodes = [...nodes, ...phaseState.addedNodes]
    edges = [...edges, ...phaseState.addedEdges]

    // Apply node overrides
    for (const override of phaseState.nodeOverrides) {
      if (override.action === 'hide') {
        nodes = nodes.filter((n) => n.id !== override.nodeId)
        edges = edges.filter((e) => e.source !== override.nodeId && e.target !== override.nodeId)
      } else if (override.action === 'modify') {
        nodes = nodes.map((n) => {
          if (n.id !== override.nodeId) return n
          return {
            ...n,
            ...(override.label !== undefined ? { label: override.label } : {}),
            ...(override.description !== undefined ? { description: override.description } : {}),
            ...(override.position !== undefined ? { position: override.position } : {}),
            ...(override.manuallyPositioned !== undefined ? { manuallyPositioned: override.manuallyPositioned } : {}),
          }
        })
      }
    }

    // Apply edge overrides
    for (const override of phaseState.edgeOverrides) {
      if (override.action === 'hide') {
        edges = edges.filter((e) => e.id !== override.edgeId)
      } else if (override.action === 'modify') {
        edges = edges.map((e) => {
          if (e.id !== override.edgeId) return e
          return { ...e, ...(override.label !== undefined ? { label: override.label } : {}) }
        })
      }
    }
  }

  return { nodes, edges }
}

/**
 * Returns a diff between two phases: added, removed, and modified element IDs.
 */
export function diffPhases(
  diagram: Diagram,
  fromPhase: PhaseId,
  toPhase: PhaseId,
): {
  addedNodeIds: string[]
  removedNodeIds: string[]
  modifiedNodeIds: string[]
  addedEdgeIds: string[]
  removedEdgeIds: string[]
} {
  const from = resolveDiagramPhase(diagram, fromPhase)
  const to = resolveDiagramPhase(diagram, toPhase)

  const fromNodeIds = new Set(from.nodes.map((n) => n.id))
  const toNodeIds = new Set(to.nodes.map((n) => n.id))
  const fromEdgeIds = new Set(from.edges.map((e) => e.id))
  const toEdgeIds = new Set(to.edges.map((e) => e.id))

  const addedNodeIds = [...toNodeIds].filter((id) => !fromNodeIds.has(id))
  const removedNodeIds = [...fromNodeIds].filter((id) => !toNodeIds.has(id))
  const modifiedNodeIds = [...toNodeIds].filter((id) => {
    if (!fromNodeIds.has(id)) return false
    const fn = from.nodes.find((n) => n.id === id)!
    const tn = to.nodes.find((n) => n.id === id)!
    return fn.label !== tn.label
  })
  const addedEdgeIds = [...toEdgeIds].filter((id) => !fromEdgeIds.has(id))
  const removedEdgeIds = [...fromEdgeIds].filter((id) => !toEdgeIds.has(id))

  return { addedNodeIds, removedNodeIds, modifiedNodeIds, addedEdgeIds, removedEdgeIds }
}
