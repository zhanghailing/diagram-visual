import { useState } from 'react'
import { Plus, Copy, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { useStore } from '@/store'
import { simulatePlanMemo } from '@/lib/feasibility'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CreatePlanModal } from './CreatePlanModal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

export function PlanList() {
  const plans = useStore((s) => s.project.plans)
  const components = useStore((s) => s.project.components)
  const dependencies = useStore((s) => s.project.dependencies)
  const activePlanId = useStore((s) => s.activePlanId)
  const setActivePlan = useStore((s) => s.setActivePlan)
  const deletePlan = useStore((s) => s.deletePlan)
  const duplicatePlan = useStore((s) => s.duplicatePlan)
  const setActiveView = useStore((s) => s.setActiveView)

  const [showCreate, setShowCreate] = useState(false)

  function handleSelectPlan(id: string) {
    setActivePlan(id)
    setActiveView('plan-timeline')
  }

  if (plans.length === 0) {
    return (
      <div className="flex flex-col gap-3 p-3">
        <div className="text-center py-4 text-muted-foreground text-sm">
          <p className="mb-1">No migration plans yet.</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)} className="w-full">
          <Plus className="h-4 w-4 mr-1" /> New Plan
        </Button>
        {showCreate && <CreatePlanModal onClose={() => setShowCreate(false)} />}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Plans ({plans.length})
        </span>
        <Button size="sm" variant="ghost" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {plans.map((plan) => {
            const result = simulatePlanMemo(plan, dependencies, components)
            const isFeasible = result.feasible
            const violationCount = result.steps.filter((s) => s.status === 'violation').length

            return (
              <div
                key={plan.id}
                onClick={() => handleSelectPlan(plan.id)}
                className={cn(
                  'group flex items-start gap-2 p-2 rounded-md cursor-pointer hover:bg-accent transition-colors',
                  plan.id === activePlanId && 'bg-accent',
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {isFeasible ? (
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                    )}
                    <span className="text-sm font-medium truncate">{plan.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 pl-5">
                    <span className="text-xs text-muted-foreground">
                      {plan.steps.length} step{plan.steps.length !== 1 ? 's' : ''}
                    </span>
                    {!isFeasible && (
                      <Badge variant="error" className="text-xs py-0 h-4">
                        {violationCount} violation{violationCount !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={(e) => { e.stopPropagation(); duplicatePlan(plan.id) }}
                    aria-label={`Duplicate ${plan.name}`}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Delete ${plan.name}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{plan.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove the plan and all its steps.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => deletePlan(plan.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      <div className="p-3 border-t">
        <Button size="sm" variant="outline" onClick={() => setShowCreate(true)} className="w-full">
          <Plus className="h-4 w-4 mr-1" /> New Plan
        </Button>
      </div>

      {showCreate && <CreatePlanModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
