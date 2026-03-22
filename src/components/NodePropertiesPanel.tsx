import { useState } from 'react'
import { useStore } from '@/store'
import type { DiagramNodeBase, DiagramId, PhaseId } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, EyeOff } from 'lucide-react'

interface Props {
  node: DiagramNodeBase
  diagramId: DiagramId
  phase: PhaseId
  onClose: () => void
}

export function NodePropertiesPanel({ node, diagramId, phase, onClose }: Props) {
  const updateDiagramElement = useStore((s) => s.updateDiagramElement)
  const [label, setLabel] = useState(node.label)

  function handleSave() {
    updateDiagramElement(diagramId, phase, {
      kind: 'node-override',
      override: { nodeId: node.id, action: 'modify', label },
    })
    onClose()
  }

  function handleHide() {
    updateDiagramElement(diagramId, phase, {
      kind: 'node-override',
      override: { nodeId: node.id, action: 'hide' },
    })
    onClose()
  }

  return (
    <div className="w-56 shrink-0 border-l bg-card flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-xs font-semibold">Properties</span>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex-1 p-3 flex flex-col gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Type</Label>
          <p className="text-xs mt-0.5 capitalize">{node.nodeType.replace('c4-', 'C4 ')}</p>
        </div>
        <div>
          <Label htmlFor="prop-label" className="text-xs text-muted-foreground">Label</Label>
          <Input
            id="prop-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
            className="mt-1 h-7 text-xs"
            autoFocus
          />
        </div>
        {phase !== 'as-is' && (
          <p className="text-[10px] text-amber-600 bg-amber-50 rounded px-2 py-1">
            Editing in <strong>{phase}</strong>. Changes saved as a phase override.
          </p>
        )}
        {phase !== 'as-is' && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs text-destructive hover:text-destructive gap-1"
            onClick={handleHide}
          >
            <EyeOff className="h-3 w-3" /> Hide in {phase}
          </Button>
        )}
      </div>

      <div className="p-3 border-t flex justify-end gap-2">
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onClose}>Cancel</Button>
        <Button size="sm" className="h-7 text-xs" onClick={handleSave}>Save</Button>
      </div>
    </div>
  )
}
