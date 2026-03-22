import type { PhaseId } from '@/types'
import { cn } from '@/lib/utils'

const PHASES: { id: PhaseId; label: string }[] = [
  { id: 'as-is', label: 'As-Is' },
  { id: 'phase-1', label: 'Phase 1' },
  { id: 'phase-2', label: 'Phase 2' },
]

interface Props {
  activePhase: PhaseId
  onChange: (phase: PhaseId) => void
}

export function PhaseSwitcher({ activePhase, onChange }: Props) {
  return (
    <div className="flex items-center gap-0.5 bg-muted rounded-md p-0.5">
      {PHASES.map((p) => (
        <button
          key={p.id}
          onClick={() => onChange(p.id)}
          className={cn(
            'px-2.5 py-1 text-xs rounded transition-colors',
            activePhase === p.id
              ? 'bg-background text-foreground font-medium shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
