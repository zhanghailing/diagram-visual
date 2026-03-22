import { describe, it, expect } from 'vitest'
import { resolveDiagramPhase, diffPhases } from './diagram-phase'
import type { Diagram, DiagramNodeBase } from '@/types'

function makeNode(id: string, label: string): DiagramNodeBase {
  return { id, nodeType: 'box', label, position: { x: 0, y: 0 } }
}

function makeDiagram(overrides?: Partial<Diagram>): Diagram {
  return {
    id: 'diag1',
    name: 'Test',
    type: 'architecture',
    baseNodes: [],
    baseEdges: [],
    phases: {},
    ...overrides,
  }
}

// ─── Phase element resolution ─────────────────────────────────────────────────

describe('resolveDiagramPhase', () => {
  it('as-is returns base elements', () => {
    const d = makeDiagram({ baseNodes: [makeNode('a', 'A'), makeNode('b', 'B')] })
    const { nodes } = resolveDiagramPhase(d, 'as-is')
    expect(nodes.map((n) => n.id)).toEqual(['a', 'b'])
  })

  it('phase-1 inherits as-is nodes and adds phase-1 nodes', () => {
    const d = makeDiagram({
      baseNodes: [makeNode('a', 'A')],
      phases: {
        'phase-1': {
          addedNodes: [makeNode('b', 'B')],
          addedEdges: [],
          nodeOverrides: [],
          edgeOverrides: [],
        },
      },
    })
    const { nodes } = resolveDiagramPhase(d, 'phase-1')
    expect(nodes.map((n) => n.id)).toEqual(expect.arrayContaining(['a', 'b']))
    expect(nodes).toHaveLength(2)
  })

  it('phase-1 hide override removes node and its edges', () => {
    const d = makeDiagram({
      baseNodes: [makeNode('a', 'A'), makeNode('b', 'B')],
      baseEdges: [{ id: 'e1', source: 'a', target: 'b' }],
      phases: {
        'phase-1': {
          addedNodes: [],
          addedEdges: [],
          nodeOverrides: [{ nodeId: 'a', action: 'hide' }],
          edgeOverrides: [],
        },
      },
    })
    const { nodes, edges } = resolveDiagramPhase(d, 'phase-1')
    expect(nodes.map((n) => n.id)).toEqual(['b'])
    expect(edges).toHaveLength(0)
  })

  it('phase-1 modify override changes label', () => {
    const d = makeDiagram({
      baseNodes: [makeNode('a', 'Old Label')],
      phases: {
        'phase-1': {
          addedNodes: [],
          addedEdges: [],
          nodeOverrides: [{ nodeId: 'a', action: 'modify', label: 'New Label' }],
          edgeOverrides: [],
        },
      },
    })
    const { nodes } = resolveDiagramPhase(d, 'phase-1')
    expect(nodes.find((n) => n.id === 'a')?.label).toBe('New Label')
  })

  it('phase-2 inherits phase-1 additions', () => {
    const d = makeDiagram({
      baseNodes: [makeNode('a', 'A')],
      phases: {
        'phase-1': {
          addedNodes: [makeNode('b', 'B')],
          addedEdges: [],
          nodeOverrides: [],
          edgeOverrides: [],
        },
        'phase-2': {
          addedNodes: [makeNode('c', 'C')],
          addedEdges: [],
          nodeOverrides: [],
          edgeOverrides: [],
        },
      },
    })
    const { nodes } = resolveDiagramPhase(d, 'phase-2')
    expect(nodes.map((n) => n.id)).toEqual(expect.arrayContaining(['a', 'b', 'c']))
    expect(nodes).toHaveLength(3)
  })

  it('as-is view does NOT show phase-1 additions', () => {
    const d = makeDiagram({
      baseNodes: [makeNode('a', 'A')],
      phases: {
        'phase-1': {
          addedNodes: [makeNode('b', 'B')],
          addedEdges: [],
          nodeOverrides: [],
          edgeOverrides: [],
        },
      },
    })
    const { nodes } = resolveDiagramPhase(d, 'as-is')
    expect(nodes.map((n) => n.id)).toEqual(['a'])
  })
})

// ─── diffPhases ───────────────────────────────────────────────────────────────

describe('diffPhases', () => {
  it('detects added nodes in phase-1 vs as-is', () => {
    const d = makeDiagram({
      baseNodes: [makeNode('a', 'A')],
      phases: {
        'phase-1': {
          addedNodes: [makeNode('b', 'B')],
          addedEdges: [],
          nodeOverrides: [],
          edgeOverrides: [],
        },
      },
    })
    const diff = diffPhases(d, 'as-is', 'phase-1')
    expect(diff.addedNodeIds).toContain('b')
    expect(diff.removedNodeIds).toHaveLength(0)
  })

  it('detects removed nodes via hide override', () => {
    const d = makeDiagram({
      baseNodes: [makeNode('a', 'A'), makeNode('b', 'B')],
      phases: {
        'phase-1': {
          addedNodes: [],
          addedEdges: [],
          nodeOverrides: [{ nodeId: 'b', action: 'hide' }],
          edgeOverrides: [],
        },
      },
    })
    const diff = diffPhases(d, 'as-is', 'phase-1')
    expect(diff.removedNodeIds).toContain('b')
  })
})
