import type { DiagramPhase } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  phases: DiagramPhase[]
  activePhase: string
  onChange: (phase: string) => void
}

export function PhaseSwitcher({ phases, activePhase, onChange }: Props) {
  return (
    <div className="flex items-center gap-0.5 bg-muted rounded-md p-0.5">
      {phases.map((p) => (
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
