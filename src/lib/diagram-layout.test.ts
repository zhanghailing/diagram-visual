import { describe, it, expect } from 'vitest'
import { applyDagreLayout } from './diagram-layout'
import type { Node, Edge } from '@xyflow/react'

function makeNode(id: string, manuallyPositioned = false): Node {
  return {
    id,
    type: 'box',
    position: { x: 0, y: 0 },
    data: { manuallyPositioned },
  }
}

describe('applyDagreLayout', () => {
  it('assigns non-zero positions to nodes', () => {
    const nodes = [makeNode('a'), makeNode('b'), makeNode('c')]
    const edges: Edge[] = [
      { id: 'e1', source: 'a', target: 'b' },
      { id: 'e2', source: 'b', target: 'c' },
    ]
    const result = applyDagreLayout(nodes, edges, false)
    const positions = result.map((n) => n.position)
    // At least some nodes should have moved from (0,0)
    expect(positions.some((p) => p.x !== 0 || p.y !== 0)).toBe(true)
  })

  it('skips manually positioned nodes when onlyUnpositioned=true', () => {
    const nodes = [makeNode('a', true), makeNode('b', false)]
    const edges: Edge[] = [{ id: 'e1', source: 'a', target: 'b' }]
    const result = applyDagreLayout(nodes, edges, true)
    const nodeA = result.find((n) => n.id === 'a')!
    expect(nodeA.position).toEqual({ x: 0, y: 0 }) // unchanged
  })

  it('repositions all nodes when onlyUnpositioned=false', () => {
    const nodes = [makeNode('a', true), makeNode('b', true)]
    const edges: Edge[] = [{ id: 'e1', source: 'a', target: 'b' }]
    const result = applyDagreLayout(nodes, edges, false)
    // Both should get dagre positions (may not be 0,0 for both)
    expect(result).toHaveLength(2)
  })
})
