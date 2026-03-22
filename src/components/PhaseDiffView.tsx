import { useState } from 'react'
import type { Diagram, PhaseId } from '@/types'
import { diffPhases } from '@/lib/diagram-phase'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { resolveDiagramPhase } from '@/lib/diagram-phase'

const PHASES: PhaseId[] = ['as-is', 'phase-1', 'phase-2']
const PHASE_LABELS: Record<PhaseId, string> = { 'as-is': 'As-Is', 'phase-1': 'Phase 1', 'phase-2': 'Phase 2' }

interface Props {
  diagram: Diagram
}

export function PhaseDiffView({ diagram }: Props) {
  const [fromPhase, setFromPhase] = useState<PhaseId>('as-is')
  const [toPhase, setToPhase] = useState<PhaseId>('phase-1')

  const diff = diffPhases(diagram, fromPhase, toPhase)
  const toResolved = resolveDiagramPhase(diagram, toPhase)
  const fromResolved = resolveDiagramPhase(diagram, fromPhase)

  function getNodeLabel(id: string): string {
    const n = toResolved.nodes.find((n) => n.id === id) ?? fromResolved.nodes.find((n) => n.id === id)
    return n?.label ?? id
  }

  const hasChanges =
    diff.addedNodeIds.length + diff.removedNodeIds.length + diff.modifiedNodeIds.length +
    diff.addedEdgeIds.length + diff.removedEdgeIds.length > 0

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Phase selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">From</span>
          <Select value={fromPhase} onValueChange={(v) => setFromPhase(v as PhaseId)}>
            <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PHASES.map((p) => <SelectItem key={p} value={p}>{PHASE_LABELS[p]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <span className="text-muted-foreground">→</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">To</span>
          <Select value={toPhase} onValueChange={(v) => setToPhase(v as PhaseId)}>
            <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PHASES.map((p) => <SelectItem key={p} value={p}>{PHASE_LABELS[p]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!hasChanges && (
        <p className="text-sm text-muted-foreground">No changes between these phases.</p>
      )}

      {diff.addedNodeIds.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-green-700 mb-1">Added ({diff.addedNodeIds.length})</h4>
          <ul className="flex flex-col gap-0.5">
            {diff.addedNodeIds.map((id) => (
              <li key={id} className="text-xs px-2 py-1 rounded bg-green-50 text-green-800 border border-green-200">
                + {getNodeLabel(id)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {diff.removedNodeIds.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-red-700 mb-1">Removed ({diff.removedNodeIds.length})</h4>
          <ul className="flex flex-col gap-0.5">
            {diff.removedNodeIds.map((id) => (
              <li key={id} className="text-xs px-2 py-1 rounded bg-red-50 text-red-800 border border-red-200">
                − {getNodeLabel(id)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {diff.modifiedNodeIds.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-yellow-700 mb-1">Modified ({diff.modifiedNodeIds.length})</h4>
          <ul className="flex flex-col gap-0.5">
            {diff.modifiedNodeIds.map((id) => (
              <li key={id} className="text-xs px-2 py-1 rounded bg-yellow-50 text-yellow-800 border border-yellow-200">
                ~ {getNodeLabel(id)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(diff.addedEdgeIds.length > 0 || diff.removedEdgeIds.length > 0) && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-1">Edges</h4>
          {diff.addedEdgeIds.map((id) => (
            <div key={id} className="text-xs px-2 py-1 rounded bg-green-50 text-green-800 border border-green-200 mb-0.5">
              + edge {id.slice(0, 8)}…
            </div>
          ))}
          {diff.removedEdgeIds.map((id) => (
            <div key={id} className="text-xs px-2 py-1 rounded bg-red-50 text-red-800 border border-red-200 mb-0.5">
              − edge {id.slice(0, 8)}…
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
