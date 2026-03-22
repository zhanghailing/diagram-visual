import { useState } from 'react'
import type { DiagramType, DiagramNodeBase, DiagramEdgeBase, SequenceParticipant, SequenceMessage } from '@/types'
import { detectMermaidType, parseMermaidFlowchart, parseMermaidC4, parseMermaidSequence } from '@/lib/mermaid-parser'
import { applyDagreLayout } from '@/lib/diagram-layout'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle } from 'lucide-react'
import type { Node, Edge } from '@xyflow/react'

interface Props {
  diagramType: DiagramType
  onImport: (nodes: DiagramNodeBase[], edges: DiagramEdgeBase[]) => void
  onImportSequence?: (participants: SequenceParticipant[], messages: SequenceMessage[]) => void
  onClose: () => void
}

const PLACEHOLDER: Record<DiagramType, string> = {
  architecture: `flowchart LR
  A[Frontend] --> B[API Gateway]
  B --> C[Auth Service]
  B --> D[Backend API]`,
  'c4-component': `C4Component
  Person(user, "End User", "A user of the system")
  System(webapp, "Web App", "The frontend")
  Container(api, "API", "REST API")
  Rel(user, webapp, "Uses", "HTTPS")
  Rel(webapp, api, "Calls", "REST")`,
  sequence: `sequenceDiagram
  participant A as Client
  participant B as Gateway
  participant C as Auth API
  A ->> B: Request
  B ->> C: Validate token
  C -->> B: OK
  B -->> A: Response`,
}

export function MermaidImportDialog({ diagramType, onImport, onImportSequence, onClose }: Props) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleImport() {
    setError(null)
    const trimmed = text.trim()
    if (!trimmed) { setError('Please paste Mermaid diagram text.'); return }

    const detectedType = detectMermaidType(trimmed)

    try {
      if (detectedType === 'flowchart') {
        if (diagramType !== 'architecture') {
          setError(`This diagram is type "${diagramType}" but you pasted a flowchart. Use an Architecture diagram to import flowcharts.`)
          return
        }
        const { nodes, edges } = parseMermaidFlowchart(trimmed)
        const rfNodes: Node[] = nodes.map((n) => ({ id: n.id, type: n.nodeType, position: n.position, data: {} }))
        const rfEdges: Edge[] = edges.map((e) => ({ id: e.id, source: e.source, target: e.target }))
        const laid = applyDagreLayout(rfNodes, rfEdges, false)
        const laidNodes = nodes.map((n) => {
          const ln = laid.find((l) => l.id === n.id)
          return ln ? { ...n, position: ln.position } : n
        })
        onImport(laidNodes, edges)
      } else if (detectedType === 'c4') {
        if (diagramType !== 'c4-component') {
          setError(`This diagram is type "${diagramType}" but you pasted C4 syntax. Use a C4 Component diagram.`)
          return
        }
        const { nodes, edges } = parseMermaidC4(trimmed)
        const rfNodes: Node[] = nodes.map((n) => ({ id: n.id, type: n.nodeType, position: n.position, data: {} }))
        const rfEdges: Edge[] = edges.map((e) => ({ id: e.id, source: e.source, target: e.target }))
        const laid = applyDagreLayout(rfNodes, rfEdges, false)
        const laidNodes = nodes.map((n) => {
          const ln = laid.find((l) => l.id === n.id)
          return ln ? { ...n, position: ln.position } : n
        })
        onImport(laidNodes, edges)
      } else if (detectedType === 'sequence') {
        if (diagramType !== 'sequence') {
          setError(`This diagram is type "${diagramType}" but you pasted a sequenceDiagram. Use a Sequence diagram.`)
          return
        }
        const { participants, messages } = parseMermaidSequence(trimmed)
        if (onImportSequence) {
          onImportSequence(participants, messages)
        }
        onClose()
      } else {
        setError(
          'Unsupported Mermaid diagram type. Only flowchart/graph, C4Component/C4Context, and sequenceDiagram are supported.',
        )
      }
    } catch (err) {
      setError(`Parse error: ${(err as Error).message}`)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import from Mermaid</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          <p className="text-xs text-muted-foreground">
            Paste Mermaid diagram text below. Supported types:{' '}
            <code className="bg-muted px-1 rounded">flowchart</code>,{' '}
            <code className="bg-muted px-1 rounded">C4Component</code>,{' '}
            <code className="bg-muted px-1 rounded">sequenceDiagram</code>.
          </p>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={PLACEHOLDER[diagramType]}
            rows={10}
            className="font-mono text-xs"
          />
          {error && (
            <div className="flex items-start gap-2 text-destructive text-xs bg-destructive/10 rounded p-2">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleImport}>Import</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
