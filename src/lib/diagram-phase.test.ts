import { describe, it, expect } from 'vitest'
import { resolveDiagramPhase, diffPhases, getPhaseOrder } from './diagram-phase'
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

// ─── getPhaseOrder ────────────────────────────────────────────────────────────

describe('getPhaseOrder', () => {
  it('returns diagram.phaseOrder when present', () => {
    const d = makeDiagram({
      phaseOrder: [
        { id: 'p0', label: 'Base' },
        { id: 'p1', label: 'Step 1' },
      ],
    })
    const order = getPhaseOrder(d)
    expect(order).toHaveLength(2)
    expect(order[0].id).toBe('p0')
    expect(order[1].id).toBe('p1')
  })

  it('returns default 3-phase list when phaseOrder is absent', () => {
    const d = makeDiagram()
    const order = getPhaseOrder(d)
    expect(order).toHaveLength(3)
    expect(order.map((p) => p.id)).toEqual(['as-is', 'phase-1', 'phase-2'])
  })

  it('returns default 3-phase list when phaseOrder is empty', () => {
    const d = makeDiagram({ phaseOrder: [] })
    const order = getPhaseOrder(d)
    expect(order).toHaveLength(3)
  })
})

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

  it('4-phase diagram: inheritance walks all phases in order', () => {
    const d = makeDiagram({
      phaseOrder: [
        { id: 'p0', label: 'Base' },
        { id: 'p1', label: 'Step 1' },
        { id: 'p2', label: 'Step 2' },
        { id: 'p3', label: 'Step 3' },
      ],
      baseNodes: [makeNode('a', 'A')],
      phases: {
        p1: { addedNodes: [makeNode('b', 'B')], addedEdges: [], nodeOverrides: [], edgeOverrides: [] },
        p2: { addedNodes: [makeNode('c', 'C')], addedEdges: [], nodeOverrides: [], edgeOverrides: [] },
        p3: { addedNodes: [makeNode('d', 'D')], addedEdges: [], nodeOverrides: [], edgeOverrides: [] },
      },
    })
    const { nodes } = resolveDiagramPhase(d, 'p3')
    expect(nodes.map((n) => n.id)).toEqual(expect.arrayContaining(['a', 'b', 'c', 'd']))
    expect(nodes).toHaveLength(4)
    // Verify p2 view does not include p3 nodes
    const { nodes: p2nodes } = resolveDiagramPhase(d, 'p2')
    expect(p2nodes.map((n) => n.id)).not.toContain('d')
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
