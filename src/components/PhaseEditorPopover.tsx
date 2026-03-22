import { useRef, useState } from 'react'
import { useStore } from '@/store'
import type { DiagramId, DiagramPhase } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Settings, Lock, Trash2, Plus, ChevronUp, ChevronDown } from 'lucide-react'

interface Props {
  diagramId: DiagramId
  phases: DiagramPhase[]
}

export function PhaseEditorPopover({ diagramId, phases }: Props) {
  const addDiagramPhase = useStore((s) => s.addDiagramPhase)
  const renameDiagramPhase = useStore((s) => s.renameDiagramPhase)
  const deleteDiagramPhase = useStore((s) => s.deleteDiagramPhase)
  const reorderDiagramPhases = useStore((s) => s.reorderDiagramPhases)
  const [open, setOpen] = useState(false)
  const newPhaseInputRef = useRef<HTMLInputElement | null>(null)

  function handleAddPhase() {
    const label = `Phase ${phases.length}`
    addDiagramPhase(diagramId, label)
    // Focus the new phase's input on next render
    requestAnimationFrame(() => {
      if (newPhaseInputRef.current) {
        newPhaseInputRef.current.focus()
        newPhaseInputRef.current.select()
      }
    })
  }

  return (
    <div className="relative">
      <Button
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0"
        onClick={() => setOpen((o) => !o)}
        title="Edit phases"
      >
        <Settings className="h-3.5 w-3.5" />
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 w-64 rounded-md border bg-popover shadow-md">
            <div className="px-3 py-2 border-b text-xs font-semibold text-muted-foreground">Edit Phases</div>
            <div className="p-2 flex flex-col gap-1">
              {phases.map((phase, idx) => {
                const isBase = idx === 0
                const isLast = idx === phases.length - 1
                return (
                  <div key={phase.id} className="flex items-center gap-1.5">
                    {isBase ? (
                      <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                    ) : (
                      <div className="w-3 shrink-0" />
                    )}
                    <Input
                      ref={isLast && !isBase ? newPhaseInputRef : undefined}
                      defaultValue={phase.label}
                      onBlur={(e) => {
                        const val = e.target.value.trim()
                        if (val && val !== phase.label) renameDiagramPhase(diagramId, phase.id, val)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur()
                      }}
                      className="h-6 text-xs flex-1"
                    />
                    {!isBase && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => reorderDiagramPhases(diagramId, idx, idx - 1)}
                          disabled={idx === 1}
                          title="Move up"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => reorderDiagramPhases(diagramId, idx, idx + 1)}
                          disabled={isLast}
                          title="Move down"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          onClick={() => deleteDiagramPhase(diagramId, phase.id)}
                          title="Delete phase"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="p-2 border-t">
              <Button
                size="sm"
                variant="outline"
                className="w-full h-7 text-xs gap-1"
                onClick={handleAddPhase}
              >
                <Plus className="h-3 w-3" /> Add Phase
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
