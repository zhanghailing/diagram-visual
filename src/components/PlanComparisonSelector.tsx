import { useStore } from '@/store'
import { simulatePlanMemo } from '@/lib/feasibility'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PlanComparisonSelector() {
  const plans = useStore((s) => s.project.plans)
  const components = useStore((s) => s.project.components)
  const dependencies = useStore((s) => s.project.dependencies)
  const comparisonPlanIds = useStore((s) => s.comparisonPlanIds)
  const setComparisonPlanIds = useStore((s) => s.setComparisonPlanIds)

  function togglePlan(id: string) {
    if (comparisonPlanIds.includes(id)) {
      setComparisonPlanIds(comparisonPlanIds.filter((p) => p !== id))
    } else if (comparisonPlanIds.length < 4) {
      setComparisonPlanIds([...comparisonPlanIds, id])
    }
  }

  if (plans.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No plans available. Create at least 2 plans to compare.</p>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Select 2–4 plans to compare ({comparisonPlanIds.length} selected)
      </p>
      <div className="grid gap-1">
        {plans.map((plan) => {
          const result = simulatePlanMemo(plan, dependencies, components)
          const isSelected = comparisonPlanIds.includes(plan.id)
          const canSelect = !isSelected && comparisonPlanIds.length < 4

          return (
            <button
              key={plan.id}
              onClick={() => togglePlan(plan.id)}
              disabled={!isSelected && !canSelect}
              className={cn(
                'flex items-center gap-2 p-2 rounded-md border text-left transition-colors',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {result.feasible ? (
                <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
              )}
              <span className="text-sm font-medium flex-1">{plan.name}</span>
              <span className="text-xs text-muted-foreground">{plan.steps.length} steps</span>
              {isSelected && (
                <Badge variant="default" className="text-xs">
                  #{comparisonPlanIds.indexOf(plan.id) + 1}
                </Badge>
              )}
            </button>
          )
        })}
      </div>
      {comparisonPlanIds.length > 0 && (
        <Button
          size="sm"
          variant="ghost"
          className="text-xs"
          onClick={() => setComparisonPlanIds([])}
        >
          Clear selection
        </Button>
      )}
    </div>
  )
}
