import { useStore } from '@/store'
import { simulatePlanMemo } from '@/lib/feasibility'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, CheckCircle, XCircle, HelpCircle, GitMerge, Split } from 'lucide-react'

interface Props {
  planId: string
  stepId: string
  onClose: () => void
}

// ─── Feasibility status display ───────────────────────────────────────────────

function FeasibilityStatus({ status, reason }: { status?: string; reason?: string }) {
  return (
    <>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground w-20 shrink-0">Feasibility</span>
        {status === 'ok' && (
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-3.5 w-3.5" /> OK
          </span>
        )}
        {status === 'violation' && (
          <span className="flex items-center gap-1 text-destructive">
            <XCircle className="h-3.5 w-3.5" /> Violation
          </span>
        )}
        {status === 'unvalidated' && (
          <span className="flex items-center gap-1 text-muted-foreground">
            <HelpCircle className="h-3.5 w-3.5" /> Unvalidated
          </span>
        )}
        {!status && <span className="text-muted-foreground text-xs">—</span>}
      </div>
      {reason && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
          {reason}
        </div>
      )}
    </>
  )
}

export function StepDetailPanel({ planId, stepId, onClose }: Props) {
  const plan = useStore((s) => s.project.plans.find((p) => p.id === planId))
  const components = useStore((s) => s.project.components)
  const dependencies = useStore((s) => s.project.dependencies)
  const releases = useStore((s) => s.project.releases)

  if (!plan) return null

  const step = plan.steps.find((s) => s.id === stepId)
  if (!step) return null

  const stepIndex = plan.steps.findIndex((s) => s.id === stepId)

  const feasibility = simulatePlanMemo(plan, dependencies, components)
  const result = feasibility.steps.find((r) => r.stepId === stepId)

  // ── Structural merge panel ─────────────────────────────────────────────────
  if (step.type === 'structural-merge') {
    const sourceNames = step.sourceIds.map(
      (id) => components.find((c) => c.id === id)?.name ?? id,
    )
    const successorComp = components.find((c) => c.id === step.successorId)

    return (
      <div className="border rounded-lg p-4 bg-card shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <GitMerge className="h-4 w-4 text-purple-600" />
            <h3 className="font-semibold text-sm">Step {stepIndex + 1}: Structural Merge</h3>
          </div>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onClose}>
            <X className="h-3 w-3" />
          </Button>
        </div>

        <div className="space-y-2 text-sm">
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs">Sources (retiring)</span>
            <div className="flex flex-wrap gap-1">
              {sourceNames.map((name) => (
                <Badge key={name} variant="outline" className="text-xs line-through opacity-70">
                  {name}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground text-xs">Successor (created)</span>
            <div className="flex items-center gap-1.5">
              <span className="font-medium">{step.successorComponent.name}</span>
              <Badge variant="outline" className="text-xs">{step.successorComponent.type}</Badge>
              {successorComp?.migrationCreated && (
                <Badge className="text-xs bg-amber-100 text-amber-800 border-amber-200">migration-created</Badge>
              )}
            </div>
          </div>

          {step.notes && (
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground w-20 shrink-0">Notes</span>
              <span className="text-sm italic text-muted-foreground">{step.notes}</span>
            </div>
          )}

          <FeasibilityStatus status={result?.status} reason={result?.reason} />
        </div>
      </div>
    )
  }

  // ── Structural split panel ─────────────────────────────────────────────────
  if (step.type === 'structural-split') {
    const srcComp = components.find((c) => c.id === step.sourceId)

    return (
      <div className="border rounded-lg p-4 bg-card shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Split className="h-4 w-4 text-indigo-600" />
            <h3 className="font-semibold text-sm">Step {stepIndex + 1}: Structural Split</h3>
          </div>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onClose}>
            <X className="h-3 w-3" />
          </Button>
        </div>

        <div className="space-y-2 text-sm">
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs">Source (retiring)</span>
            <div className="flex items-center gap-1.5">
              <span className="font-medium line-through opacity-70">
                {srcComp?.name ?? step.sourceId}
              </span>
              {srcComp && (
                <Badge variant="outline" className="text-xs">{srcComp.type}</Badge>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground text-xs">Successors (created)</span>
            <div className="space-y-0.5">
              {step.successorComponents.map((def, idx) => (
                <div key={step.successorIds[idx]} className="flex items-center gap-1.5">
                  <span className="font-medium text-sm">{def.name}</span>
                  <Badge variant="outline" className="text-xs">{def.type}</Badge>
                </div>
              ))}
            </div>
          </div>

          {step.notes && (
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground w-20 shrink-0">Notes</span>
              <span className="text-sm italic text-muted-foreground">{step.notes}</span>
            </div>
          )}

          <FeasibilityStatus status={result?.status} reason={result?.reason} />
        </div>
      </div>
    )
  }

  // ── State-transition panel (original) ─────────────────────────────────────
  const comp = components.find((c) => c.id === step.componentId)
  const fromStateName = comp?.states.find((s) => s.id === step.fromState)?.name ?? step.fromState
  const toStateName = comp?.states.find((s) => s.id === step.toState)?.name ?? step.toState

  const releaseEntry = releases.find(
    (r) =>
      r.componentId === step.componentId &&
      r.fromState === step.fromState &&
      r.toState === step.toState,
  )

  return (
    <div className="border rounded-lg p-4 bg-card shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Step {stepIndex + 1} Detail</h3>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onClose}>
          <X className="h-3 w-3" />
        </Button>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground w-20 shrink-0">Component</span>
          <span className="font-medium">{comp?.name ?? step.componentId}</span>
          {comp && (
            <Badge variant="outline" className="text-xs">{comp.type}</Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground w-20 shrink-0">Transition</span>
          <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
            {fromStateName} → {toStateName}
          </span>
        </div>

        {step.notes && (
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground w-20 shrink-0">Notes</span>
            <span className="text-sm italic text-muted-foreground">{step.notes}</span>
          </div>
        )}

        <FeasibilityStatus status={result?.status} reason={result?.reason} />

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground w-20 shrink-0">Released</span>
          {!releaseEntry || releaseEntry.status === 'untracked' ? (
            <Badge variant="outline" className="text-xs">Not tracked</Badge>
          ) : releaseEntry.status === 'released' ? (
            <Badge variant="success" className="text-xs">Released</Badge>
          ) : (
            <Badge variant="warning" className="text-xs">Implemented</Badge>
          )}
        </div>
      </div>
    </div>
  )
}
