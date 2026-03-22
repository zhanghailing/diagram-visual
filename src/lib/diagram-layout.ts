import dagre from 'dagre'
import type { Node, Edge } from '@xyflow/react'

const NODE_WIDTH = 180
const NODE_HEIGHT = 80

/**
 * Applies dagre auto-layout to a set of React Flow nodes and edges.
 * @param onlyUnpositioned When true, only nodes without manuallyPositioned=true are repositioned.
 */
export function applyDagreLayout(nodes: Node[], edges: Edge[], onlyUnpositioned = true): Node[] {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 80 })

  for (const node of nodes) {
    if (onlyUnpositioned && node.data?.manuallyPositioned) continue
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  }
  for (const edge of edges) {
    if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
      g.setEdge(edge.source, edge.target)
    }
  }

  dagre.layout(g)

  return nodes.map((n) => {
    if (onlyUnpositioned && n.data?.manuallyPositioned) return n
    if (!g.hasNode(n.id)) return n
    const pos = g.node(n.id)
    return { ...n, position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 } }
  })
}
