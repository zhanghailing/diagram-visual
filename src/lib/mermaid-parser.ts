import { generateId } from '@/lib/utils'
import type { DiagramNodeBase, DiagramEdgeBase, SequenceParticipant, SequenceMessage } from '@/types'

export type ParsedFlowchart = { nodes: DiagramNodeBase[]; edges: DiagramEdgeBase[] }
export type ParsedC4 = { nodes: DiagramNodeBase[]; edges: DiagramEdgeBase[] }
export type ParsedSequence = { participants: SequenceParticipant[]; messages: SequenceMessage[] }

// ─── Flowchart / graph ────────────────────────────────────────────────────────

/**
 * Parse Mermaid `graph` or `flowchart` syntax into canvas nodes and edges.
 * Supports: node declarations with optional labels, edges (-->, --->, --, etc.)
 */
export function parseMermaidFlowchart(text: string): ParsedFlowchart {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)

  const firstLine = lines[0]?.toLowerCase() ?? ''
  if (!firstLine.startsWith('graph') && !firstLine.startsWith('flowchart')) {
    throw new Error('Expected "graph" or "flowchart" as the first line.')
  }

  const nodeMap = new Map<string, { id: string; label: string }>()
  const edges: DiagramEdgeBase[] = []

  function ensureNode(rawId: string, label?: string): string {
    if (!nodeMap.has(rawId)) {
      nodeMap.set(rawId, { id: generateId(), label: label ?? rawId })
    } else if (label) {
      nodeMap.get(rawId)!.label = label
    }
    return nodeMap.get(rawId)!.id
  }

  // Edge patterns: A --> B, A -->|label| B, A -- label --> B
  const EDGE_RE = /^([A-Za-z0-9_]+)(?:\[([^\]]+)\])?\s*(?:--[>-]+(?:\|([^|]+)\|)?|-\.->|===>|==>)\s*([A-Za-z0-9_]+)(?:\[([^\]]+)\])?/

  for (const line of lines.slice(1)) {
    if (line.startsWith('%%') || line.startsWith('style') || line.startsWith('classDef')) continue

    const edgeMatch = EDGE_RE.exec(line)
    if (edgeMatch) {
      const [, srcId, srcLabel, edgeLabel, tgtId, tgtLabel] = edgeMatch
      const sourceId = ensureNode(srcId, srcLabel)
      const targetId = ensureNode(tgtId, tgtLabel)
      edges.push({ id: generateId(), source: sourceId, target: targetId, label: edgeLabel })
      continue
    }

    // Standalone node declarations: A[Label] or A(Label) or A{Label}
    const nodeMatch = /^([A-Za-z0-9_]+)[\[\({\|]([^\]\)\}|]+)[\]\)\}|]/.exec(line)
    if (nodeMatch) {
      ensureNode(nodeMatch[1], nodeMatch[2])
    }
  }

  const nodes: DiagramNodeBase[] = [...nodeMap.values()].map((n) => ({
    id: n.id,
    nodeType: 'box',
    label: n.label,
    position: { x: 0, y: 0 },
    manuallyPositioned: false,
  }))

  return { nodes, edges }
}

// ─── C4 ───────────────────────────────────────────────────────────────────────

/**
 * Parse Mermaid C4Component or C4Context syntax.
 * Supports: Person, System, Container, Component, Rel
 */
export function parseMermaidC4(text: string): ParsedC4 {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)

  const firstLine = lines[0]?.toLowerCase() ?? ''
  if (!firstLine.startsWith('c4component') && !firstLine.startsWith('c4context')) {
    throw new Error('Expected "C4Component" or "C4Context" as the first line.')
  }

  const nodes: DiagramNodeBase[] = []
  const edges: DiagramEdgeBase[] = []
  const aliasToId = new Map<string, string>()

  function ensureId(alias: string) {
    if (!aliasToId.has(alias)) aliasToId.set(alias, generateId())
    return aliasToId.get(alias)!
  }

  // Patterns: Person(alias, "label", "desc"), Rel(from, to, "label", "tech")
  const ELEMENT_RE = /^(Person|System|Container|Component)\(([^,]+),\s*"([^"]+)"(?:,\s*"([^"]*)")?\)/i
  const REL_RE = /^Rel(?:_[A-Za-z]+)?\(([^,]+),\s*([^,]+),\s*"([^"]+)"(?:,\s*"([^"]*)")?\)/i

  for (const line of lines.slice(1)) {
    if (line.startsWith('%%') || line === '}') continue

    const elemMatch = ELEMENT_RE.exec(line)
    if (elemMatch) {
      const [, type, alias, label, description] = elemMatch
      const id = ensureId(alias.trim())
      const nodeTypeMap: Record<string, string> = {
        person: 'c4-person',
        system: 'c4-system',
        container: 'c4-container',
        component: 'c4-component',
      }
      nodes.push({
        id,
        nodeType: nodeTypeMap[type.toLowerCase()] ?? 'box',
        label,
        description,
        position: { x: 0, y: 0 },
        manuallyPositioned: false,
      })
      continue
    }

    const relMatch = REL_RE.exec(line)
    if (relMatch) {
      const [, from, to, label, technology] = relMatch
      edges.push({
        id: generateId(),
        source: ensureId(from.trim()),
        target: ensureId(to.trim()),
        label,
        technology,
      })
    }
  }

  return { nodes, edges }
}

// ─── Sequence ─────────────────────────────────────────────────────────────────

/**
 * Parse Mermaid `sequenceDiagram` syntax.
 * Supports: participant declarations, ->> and --> messages
 */
export function parseMermaidSequence(text: string): ParsedSequence {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)

  const firstLine = lines[0]?.toLowerCase() ?? ''
  if (!firstLine.startsWith('sequencediagram')) {
    throw new Error('Expected "sequenceDiagram" as the first line.')
  }

  const participantMap = new Map<string, { id: string; label: string; order: number }>()
  const messages: SequenceMessage[] = []

  function ensureParticipant(alias: string, label?: string): string {
    if (!participantMap.has(alias)) {
      participantMap.set(alias, {
        id: generateId(),
        label: label ?? alias,
        order: participantMap.size,
      })
    }
    return participantMap.get(alias)!.id
  }

  // participant A as "Label"  or  participant A
  const PARTICIPANT_RE = /^participant\s+(\S+)(?:\s+as\s+"?([^"]+)"?)?/i
  // A ->> B: message  or  A --> B: message
  const MSG_RE = /^([^-\s]+)\s*(?:-->>|--[>-]+|->>|->)\s*([^:]+):\s*(.+)/

  for (const line of lines.slice(1)) {
    if (line.startsWith('%%') || line.startsWith('note') || line.startsWith('loop') || line === 'end') continue

    const pMatch = PARTICIPANT_RE.exec(line)
    if (pMatch) {
      ensureParticipant(pMatch[1], pMatch[2]?.trim())
      continue
    }

    const mMatch = MSG_RE.exec(line)
    if (mMatch) {
      const [, from, to, label] = mMatch
      const fromId = ensureParticipant(from.trim())
      const toId = ensureParticipant(to.trim())
      messages.push({ id: generateId(), from: fromId, to: toId, label: label.trim(), order: messages.length })
    }
  }

  const participants: SequenceParticipant[] = [...participantMap.values()].sort((a, b) => a.order - b.order)
  return { participants, messages }
}

// ─── Type detection ───────────────────────────────────────────────────────────

export type MermaidType = 'flowchart' | 'c4' | 'sequence' | 'unsupported'

export function detectMermaidType(text: string): MermaidType {
  const first = text.trim().split('\n')[0]?.trim().toLowerCase() ?? ''
  if (first.startsWith('graph') || first.startsWith('flowchart')) return 'flowchart'
  if (first.startsWith('c4component') || first.startsWith('c4context')) return 'c4'
  if (first.startsWith('sequencediagram')) return 'sequence'
  return 'unsupported'
}
