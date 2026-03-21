import { useStore } from '@/store'
import { simulatePlanMemo } from '@/lib/feasibility'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, CheckCircle, XCircle, HelpCircle } from 'lucide-react'

interface Props {
  planId: string
  stepId: string
  onClose: () => void
}

export function StepDetailPanel({ planId, stepId, onClose }: Props) {
  const plan = useStore((s) => s.project.plans.find((p) => p.id === planId))
  const components = useStore((s) => s.project.components)
  const dependencies = useStore((s) => s.project.dependencies)
  const releases = useStore((s) => s.project.releases)

  if (!plan) return null

  const step = plan.steps.find((s) => s.id === stepId)
  if (!step) return null

  const comp = components.find((c) => c.id === step.componentId)
  const fromStateName = comp?.states.find((s) => s.id === step.fromState)?.name ?? step.fromState
  const toStateName = comp?.states.find((s) => s.id === step.toState)?.name ?? step.toState

  const feasibility = simulatePlanMemo(plan, dependencies, components)
  const result = feasibility.steps.find((r) => r.stepId === stepId)

  const releaseEntry = releases.find(
    (r) =>
      r.componentId === step.componentId &&
      r.fromState === step.fromState &&
      r.toState === step.toState,
  )

  const stepIndex = plan.steps.findIndex((s) => s.id === stepId)

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

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground w-20 shrink-0">Feasibility</span>
          {result?.status === 'ok' && (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-3.5 w-3.5" /> OK
            </span>
          )}
          {result?.status === 'violation' && (
            <span className="flex items-center gap-1 text-destructive">
              <XCircle className="h-3.5 w-3.5" /> Violation
            </span>
          )}
          {result?.status === 'unvalidated' && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <HelpCircle className="h-3.5 w-3.5" /> Unvalidated
            </span>
          )}
        </div>

        {result?.reason && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
            {result.reason}
          </div>
        )}

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
