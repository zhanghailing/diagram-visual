import { useState } from 'react'
import { useStore } from '@/store'
import type { DiagramType } from '@/types'
import { DiagramCanvasView } from './DiagramCanvasView'
import { SequenceDiagramView } from './SequenceDiagramView'
import { MermaidDiagramView } from './MermaidDiagramView'
import { PhaseDiffView } from '@/components/PhaseDiffView'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, ArrowLeft, GitCompare } from 'lucide-react'

const DIAGRAM_TYPE_LABELS: Record<DiagramType, string> = {
  'c4-component': 'C4 Component',
  architecture: 'Architecture',
  sequence: 'Sequence',
  mermaid: 'Mermaid',
}

export function DiagramListView() {
  const diagrams = useStore((s) => s.project.diagrams ?? [])
  const createDiagram = useStore((s) => s.createDiagram)
  const deleteDiagram = useStore((s) => s.deleteDiagram)
  const activeDiagramId = useStore((s) => s.activeDiagramId)
  const setActiveDiagram = useStore((s) => s.setActiveDiagram)

  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<DiagramType>('architecture')
  const [showDiff, setShowDiff] = useState(false)

  const activeDiagram = diagrams.find((d) => d.id === activeDiagramId) ?? null

  function handleCreate() {
    if (!newName.trim()) return
    const d = createDiagram(newName.trim(), newType)
    setActiveDiagram(d.id)
    setNewName('')
    setShowNew(false)
  }

  // Show diagram canvas/sequence view when one is active
  if (activeDiagram) {
    return (
      <div className="flex flex-col h-full">
        {/* Back bar */}
        <div className="flex items-center gap-2 px-3 py-1.5 border-b bg-card shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setActiveDiagram(null)}
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All Diagrams
          </Button>
          <div className="flex-1" />
          {activeDiagram.type !== 'sequence' && activeDiagram.type !== 'mermaid' && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setShowDiff(!showDiff)}
            >
              <GitCompare className="h-3.5 w-3.5" /> Phase Diff
            </Button>
          )}
        </div>

        <div className="flex flex-1 min-h-0">
          <div className="flex-1 min-w-0">
            {activeDiagram.type === 'sequence' ? (
              <SequenceDiagramView diagram={activeDiagram} />
            ) : activeDiagram.type === 'mermaid' ? (
              <MermaidDiagramView diagram={activeDiagram} />
            ) : (
              <DiagramCanvasView diagram={activeDiagram} />
            )}
          </div>
          {showDiff && activeDiagram.type !== 'sequence' && activeDiagram.type !== 'mermaid' && (
            <div className="w-64 shrink-0 border-l bg-card overflow-y-auto">
              <div className="px-3 py-2 border-b">
                <span className="text-xs font-semibold">Phase Diff</span>
              </div>
              <PhaseDiffView diagram={activeDiagram} />
            </div>
          )}
        </div>
      </div>
    )
  }

  // Diagram list
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card shrink-0">
        <h2 className="font-semibold text-sm">Diagrams</h2>
        <Button size="sm" className="h-7 text-xs gap-1" onClick={() => setShowNew(true)}>
          <Plus className="h-3.5 w-3.5" /> New Diagram
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {diagrams.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <p className="text-sm">No diagrams yet.</p>
            <Button size="sm" variant="outline" onClick={() => setShowNew(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Create your first diagram
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {diagrams.map((d) => (
              <div
                key={d.id}
                className="flex flex-col gap-2 p-3 rounded-lg border bg-card hover:border-primary/50 cursor-pointer transition-colors"
                onClick={() => setActiveDiagram(d.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium truncate">{d.name}</span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{d.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteDiagram(d.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <span className="text-xs text-muted-foreground bg-accent px-1.5 py-0.5 rounded w-fit">
                  {DIAGRAM_TYPE_LABELS[d.type]}
                </span>
                <p className="text-xs text-muted-foreground">
                  {d.type === 'sequence'
                    ? `${(d.baseParticipants ?? []).length} participants`
                    : d.type === 'mermaid'
                      ? `${(d.mermaidCode ?? '').split('\n').length} lines`
                      : `${d.baseNodes.length} nodes · ${d.baseEdges.length} edges`}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showNew && (
        <Dialog open onOpenChange={() => setShowNew(false)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>New Diagram</DialogTitle></DialogHeader>
            <div className="flex flex-col gap-3 py-2">
              <div>
                <Label className="text-xs">Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
                  placeholder="e.g. As-Is Architecture"
                  autoFocus
                  className="mt-1 h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={newType} onValueChange={(v) => setNewType(v as DiagramType)}>
                  <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="architecture">Architecture</SelectItem>
                    <SelectItem value="c4-component">C4 Component</SelectItem>
                    <SelectItem value="sequence">Sequence</SelectItem>
                    <SelectItem value="mermaid">Mermaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button size="sm" variant="ghost" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreate}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
