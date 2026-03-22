import type { DiagramType } from '@/types'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PaletteItem {
  nodeType: string
  label: string
  description: string
}

const C4_ITEMS: PaletteItem[] = [
  { nodeType: 'c4-person', label: 'Person', description: 'A user or actor' },
  { nodeType: 'c4-system', label: 'System', description: 'A software system' },
  { nodeType: 'c4-container', label: 'Container', description: 'App / data store' },
  { nodeType: 'c4-component', label: 'Component', description: 'Internal component' },
]

const ARCH_ITEMS: PaletteItem[] = [
  { nodeType: 'box', label: 'Box', description: 'Generic service/module' },
  { nodeType: 'database', label: 'Database', description: 'Database / data store' },
  { nodeType: 'actor', label: 'Actor', description: 'External user/system' },
  { nodeType: 'queue', label: 'Queue', description: 'Message queue/topic' },
]

interface Props {
  diagramType: DiagramType
  onAddNode: (nodeType: string, label: string) => void
}

export function DiagramPalette({ diagramType, onAddNode }: Props) {
  const [pending, setPending] = useState<PaletteItem | null>(null)
  const [labelInput, setLabelInput] = useState('')

  if (diagramType === 'sequence') return null

  const items = diagramType === 'c4-component' ? C4_ITEMS : ARCH_ITEMS

  function handleClick(item: PaletteItem) {
    setPending(item)
    setLabelInput(item.label)
  }

  function handleConfirm() {
    if (!pending) return
    onAddNode(pending.nodeType, labelInput.trim() || pending.label)
    setPending(null)
    setLabelInput('')
  }

  return (
    <>
      <div className="w-36 shrink-0 border-r bg-card flex flex-col p-2 gap-1">
        <span className="text-xs font-semibold text-muted-foreground mb-1 px-1">Elements</span>
        {items.map((item) => (
          <Button
            key={item.nodeType}
            variant="outline"
            size="sm"
            className="h-auto py-2 px-2 flex flex-col items-start text-left justify-start gap-0.5"
            onClick={() => handleClick(item)}
          >
            <span className="text-xs font-medium">{item.label}</span>
            <span className="text-[10px] text-muted-foreground leading-tight">{item.description}</span>
          </Button>
        ))}
      </div>

      {pending && (
        <Dialog open onOpenChange={() => setPending(null)}>
          <DialogContent className="sm:max-w-xs">
            <DialogHeader>
              <DialogTitle>Add {pending.label}</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <Label htmlFor="node-label" className="text-xs">Label</Label>
              <Input
                id="node-label"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm() }}
                autoFocus
                className="mt-1 h-8 text-sm"
              />
            </div>
            <DialogFooter>
              <Button size="sm" variant="ghost" onClick={() => setPending(null)}>Cancel</Button>
              <Button size="sm" onClick={handleConfirm}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
