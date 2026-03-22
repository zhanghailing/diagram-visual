import { describe, it, expect } from 'vitest'
import { resolvedPhaseToMermaid, type ResolvedPhase } from './diagram-phase'
import { toSafeFilename } from './project-io'
import type { DiagramNodeBase, DiagramEdgeBase } from '@/types'

function makeNode(id: string, label: string): DiagramNodeBase {
  return { id, nodeType: 'box', label, position: { x: 0, y: 0 } }
}

function makeEdge(id: string, source: string, target: string, label?: string): DiagramEdgeBase {
  return { id, source, target, label }
}

// ─── resolvedPhaseToMermaid ───────────────────────────────────────────────────

describe('resolvedPhaseToMermaid', () => {
  it('outputs flowchart LR header', () => {
    const phase: ResolvedPhase = { nodes: [], edges: [] }
    expect(resolvedPhaseToMermaid(phase)).toBe('flowchart LR')
  })

  it('renders nodes as id[label]', () => {
    const phase: ResolvedPhase = {
      nodes: [makeNode('abc-123', 'My Service')],
      edges: [],
    }
    const output = resolvedPhaseToMermaid(phase)
    expect(output).toContain('nabc123[My Service]')
  })

  it('renders edges without label as -->', () => {
    const phase: ResolvedPhase = {
      nodes: [makeNode('a-1', 'A'), makeNode('b-2', 'B')],
      edges: [makeEdge('e1', 'a-1', 'b-2')],
    }
    const output = resolvedPhaseToMermaid(phase)
    expect(output).toContain('na1 --> nb2')
  })

  it('renders edges with label as -->|label|', () => {
    const phase: ResolvedPhase = {
      nodes: [makeNode('a-1', 'A'), makeNode('b-2', 'B')],
      edges: [makeEdge('e1', 'a-1', 'b-2', 'calls')],
    }
    const output = resolvedPhaseToMermaid(phase)
    expect(output).toContain('na1 -->|calls| nb2')
  })

  it('escapes square brackets in node labels', () => {
    const phase: ResolvedPhase = {
      nodes: [makeNode('x-1', 'Service [v2]')],
      edges: [],
    }
    const output = resolvedPhaseToMermaid(phase)
    expect(output).not.toContain('[v2]')
    expect(output).toContain('(v2)')
  })

  it('escapes double quotes in node labels', () => {
    const phase: ResolvedPhase = {
      nodes: [makeNode('x-1', 'Say "hello"')],
      edges: [],
    }
    const output = resolvedPhaseToMermaid(phase)
    expect(output).not.toContain('"hello"')
    expect(output).toContain('#quot;hello#quot;')
  })

  it('strips hyphens from node IDs to produce valid Mermaid IDs', () => {
    const phase: ResolvedPhase = {
      nodes: [makeNode('550e8400-e29b-41d4-a716-446655440000', 'UUID Node')],
      edges: [],
    }
    const output = resolvedPhaseToMermaid(phase)
    expect(output).toContain('n550e8400e29b41d4a716446655440000[UUID Node]')
  })
})

// ─── toSafeFilename ───────────────────────────────────────────────────────────

describe('toSafeFilename', () => {
  it('lowercases the name', () => {
    expect(toSafeFilename('MyDiagram')).toBe('mydiagram')
  })

  it('replaces spaces with hyphens', () => {
    expect(toSafeFilename('My Diagram Name')).toBe('my-diagram-name')
  })

  it('replaces special characters with hyphens', () => {
    expect(toSafeFilename('Diagram (v2)!')).toBe('diagram--v2--')
  })

  it('preserves existing hyphens and underscores', () => {
    expect(toSafeFilename('my-diagram_v2')).toBe('my-diagram_v2')
  })

  it('produces correct PNG filename pattern', () => {
    const name = 'My System'
    const phase = 'phase-1'
    expect(`${toSafeFilename(name)}-${phase}.png`).toBe('my-system-phase-1.png')
  })

  it('produces correct ZIP filename pattern', () => {
    const name = 'My System'
    expect(`${toSafeFilename(name)}-all-phases.zip`).toBe('my-system-all-phases.zip')
  })
})
