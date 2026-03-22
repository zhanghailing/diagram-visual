import { useState } from 'react'
import { useStore } from '@/store'
import type { DiagramEdgeBase, DiagramId, PhaseId } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, EyeOff } from 'lucide-react'

interface Props {
  edge: DiagramEdgeBase
  diagramId: DiagramId
  phase: PhaseId
  phaseLabel: string
  onClose: () => void
}

export function EdgePropertiesPanel({ edge, diagramId, phase, phaseLabel, onClose }: Props) {
  const updateDiagramElement = useStore((s) => s.updateDiagramElement)
  const [label, setLabel] = useState(edge.label ?? '')

  function handleSave() {
    updateDiagramElement(diagramId, phase, {
      kind: 'edge-override',
      override: { edgeId: edge.id, action: 'modify', label: label || undefined },
    })
    onClose()
  }

  function handleHide() {
    updateDiagramElement(diagramId, phase, {
      kind: 'edge-override',
      override: { edgeId: edge.id, action: 'hide' },
    })
    onClose()
  }

  return (
    <div className="w-56 shrink-0 border-l bg-card flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-xs font-semibold">Edge Properties</span>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex-1 p-3 flex flex-col gap-3">
        <div>
          <Label htmlFor="edge-label" className="text-xs text-muted-foreground">Label</Label>
          <Input
            id="edge-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
            className="mt-1 h-7 text-xs"
            placeholder="Optional"
            autoFocus
          />
        </div>
        {phase !== 'as-is' && (
          <p className="text-[10px] text-amber-600 bg-amber-50 rounded px-2 py-1">
            Editing in <strong>{phaseLabel}</strong>. Changes saved as a phase override.
          </p>
        )}
        {phase !== 'as-is' && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs text-destructive hover:text-destructive gap-1"
            onClick={handleHide}
          >
            <EyeOff className="h-3 w-3" /> Hide in {phaseLabel}
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
