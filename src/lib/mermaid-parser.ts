import { generateId } from '@/lib/utils'
import type { DiagramNodeBase, DiagramEdgeBase, SequenceParticipant, SequenceMessage } from '@/types'
import mermaid from 'mermaid'
import type { Diagram } from 'mermaid/dist/Diagram.js'
import type { FlowDB } from 'mermaid/dist/diagrams/flowchart/flowDb.js'
import type { SequenceDB } from 'mermaid/dist/diagrams/sequence/sequenceDb.js'

// Ensure diagram type detectors are registered (addDiagrams is called inside initialize)
let initialized = false
function ensureInitialized() {
  if (!initialized) {
    mermaid.initialize({ startOnLoad: false })
    initialized = true
  }
}

export type ParsedFlowchart = { nodes: DiagramNodeBase[]; edges: DiagramEdgeBase[] }
export type ParsedC4 = { nodes: DiagramNodeBase[]; edges: DiagramEdgeBase[] }
export type ParsedSequence = { participants: SequenceParticipant[]; messages: SequenceMessage[] }

export class MermaidParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MermaidParseError'
  }
}

// ─── Flowchart / graph ────────────────────────────────────────────────────────

/**
 * Parse Mermaid `graph` or `flowchart` syntax into canvas nodes and edges.
 * Uses Mermaid's internal AST parser to support the full Mermaid grammar.
 * Subgraph blocks are skipped with a console warning.
 */
export async function parseMermaidFlowchart(text: string): Promise<ParsedFlowchart> {
  ensureInitialized()
  const firstLine = text.trim().split('\n')[0]?.toLowerCase() ?? ''
  if (!firstLine.startsWith('graph') && !firstLine.startsWith('flowchart')) {
    throw new MermaidParseError('Expected "graph" or "flowchart" as the first line.')
  }

  let diagram: Diagram
  try {
    diagram = await mermaid.mermaidAPI.getDiagramFromText(text)
  } catch (err) {
    throw new MermaidParseError(`Parse error: ${(err as Error).message}`)
  }

  const db = diagram.db as FlowDB
  const vertexMap = db.getVertices()
  const flowEdges = db.getEdges()
  const subGraphs = db.getSubGraphs()

  if (subGraphs.length > 0) {
    console.warn(`[mermaid-parser] ${subGraphs.length} subgraph(s) were skipped during import.`)
  }

  // Map mermaid vertex IDs to our generated IDs
  const idMap = new Map<string, string>()
  const nodes: DiagramNodeBase[] = []

  for (const [mermaidId, vertex] of vertexMap) {
    const id = generateId()
    idMap.set(mermaidId, id)
    nodes.push({
      id,
      nodeType: 'box',
      label: vertex.text ?? mermaidId,
      position: { x: 0, y: 0 },
      manuallyPositioned: false,
    })
  }

  const edges: DiagramEdgeBase[] = flowEdges
    .filter((e) => idMap.has(e.start) && idMap.has(e.end))
    .map((e) => ({
      id: generateId(),
      source: idMap.get(e.start)!,
      target: idMap.get(e.end)!,
      label: e.text || undefined,
    }))

  return { nodes, edges }
}

// ─── C4 ───────────────────────────────────────────────────────────────────────

/**
 * Parse Mermaid C4Component or C4Context syntax.
 * Uses a regex-based parser — C4 is not supported by @mermaid-js/parser or Diagram.fromText.
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

// Mermaid LINETYPE values that represent actual signal messages (not control-flow blocks)
const SIGNAL_TYPES = new Set([
  0,  // SOLID  (--> style)
  1,  // DOTTED (-->> style)
  3,  // SOLID_CROSS  (-x)
  4,  // DOTTED_CROSS (--x)
  5,  // SOLID_OPEN   (->)
  6,  // DOTTED_OPEN  (-->)
  24, // SOLID_POINT  (-))
  25, // DOTTED_POINT (--))
  33, // BIDIRECTIONAL_SOLID
  34, // BIDIRECTIONAL_DOTTED
  // Lifeline top/bottom variants
  41, 42, 43, 44, 45, 46, 47, 48,
  51, 52, 53, 54, 55, 56, 57, 58,
  59, 60, 61,
])

/**
 * Parse Mermaid `sequenceDiagram` syntax.
 * Uses Mermaid's internal AST parser to support `actor`, all arrow types,
 * and `%%` comments. Unsupported block constructs (loop, alt, par, etc.) are skipped.
 */
export async function parseMermaidSequence(text: string): Promise<ParsedSequence> {
  ensureInitialized()
  const firstLine = text.trim().split('\n')[0]?.toLowerCase() ?? ''
  if (!firstLine.startsWith('sequencediagram')) {
    throw new MermaidParseError('Expected "sequenceDiagram" as the first line.')
  }

  let diagram: Diagram
  try {
    diagram = await mermaid.mermaidAPI.getDiagramFromText(text)
  } catch (err) {
    throw new MermaidParseError(`Parse error: ${(err as Error).message}`)
  }

  const db = diagram.db as SequenceDB
  const actorMap = db.getActors()
  const actorKeys = db.getActorKeys()
  const rawMessages = db.getMessages()

  // Build participants in declaration order (actorKeys preserves order)
  const participantIdMap = new Map<string, string>()
  const participants: SequenceParticipant[] = actorKeys.map((key, order) => {
    const actor = actorMap.get(key)!
    const id = generateId()
    participantIdMap.set(key, id)
    return { id, label: actor.description || actor.name, order }
  })

  // Filter to actual signal messages only; skip control-flow entries
  const messages: SequenceMessage[] = []
  for (const msg of rawMessages) {
    if (
      typeof msg.from !== 'string' ||
      typeof msg.to !== 'string' ||
      typeof msg.message !== 'string' ||
      (msg.type !== undefined && !SIGNAL_TYPES.has(msg.type))
    ) {
      if (msg.type !== undefined && !SIGNAL_TYPES.has(msg.type)) {
        console.warn(`[mermaid-parser] Skipped unsupported sequence construct (type=${msg.type}).`)
      }
      continue
    }

    // Auto-register participants that appear only in messages (not declared)
    if (!participantIdMap.has(msg.from)) {
      const id = generateId()
      participantIdMap.set(msg.from, id)
      participants.push({ id, label: msg.from, order: participants.length })
    }
    if (!participantIdMap.has(msg.to)) {
      const id = generateId()
      participantIdMap.set(msg.to, id)
      participants.push({ id, label: msg.to, order: participants.length })
    }

    messages.push({
      id: generateId(),
      from: participantIdMap.get(msg.from)!,
      to: participantIdMap.get(msg.to)!,
      label: msg.message,
      order: messages.length,
    })
  }

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
