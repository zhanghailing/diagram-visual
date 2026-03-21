import type {
  MigrationPlan,
  DependencyEdge,
  Component,
  PlanFeasibilityResult,
  StepResult,
  ComponentId,
  StateId,
} from '@/types'

/**
 * Simulate a migration plan step-by-step.
 *
 * For each step we:
 * 1. Find all dependency edges whose `to === step.componentId` and `toState === step.toState`
 * 2. Check that each such edge's `from` component is currently in (or has passed) `fromState`
 * 3. If all preconditions pass → status "ok", else "violation"
 * 4. Once a violation occurs all subsequent steps are "unvalidated"
 */
export function simulatePlan(
  plan: MigrationPlan,
  dependencies: DependencyEdge[],
  components: Component[],
): PlanFeasibilityResult {
  // Initialise each component to its first state
  const currentState = new Map<ComponentId, StateId>()
  for (const c of components) {
    if (c.states.length > 0) {
      currentState.set(c.id, c.states[0].id)
    }
  }

  const stepResults: StepResult[] = []
  let firstViolationIndex = -1

  for (let i = 0; i < plan.steps.length; i++) {
    const step = plan.steps[i]

    if (firstViolationIndex !== -1) {
      // After the first violation all remaining steps are unvalidated
      stepResults.push({ stepId: step.id, status: 'unvalidated' })
      continue
    }

    // Find all edges that gate this transition
    const gatingEdges = dependencies.filter(
      (e) => e.to === step.componentId && e.toState === step.toState,
    )

    let violation: string | undefined

    for (const edge of gatingEdges) {
      const depCurrentState = currentState.get(edge.from)
      const depComponent = components.find((c) => c.id === edge.from)
      const depStateList = depComponent?.states ?? []
      const depCurrentIndex = depStateList.findIndex((s) => s.id === depCurrentState)
      const requiredIndex = depStateList.findIndex((s) => s.id === edge.fromState)

      // The dependency is satisfied if the component's current state index >= required index
      if (depCurrentIndex < requiredIndex) {
        const depName = depComponent?.name ?? edge.from
        const requiredStateName =
          depStateList.find((s) => s.id === edge.fromState)?.name ?? edge.fromState
        violation = `Requires "${depName}" to be in state "${requiredStateName}" first`
        break
      }
    }

    if (violation) {
      stepResults.push({ stepId: step.id, status: 'violation', reason: violation })
      firstViolationIndex = i
    } else {
      stepResults.push({ stepId: step.id, status: 'ok' })
      // Advance the component's state
      currentState.set(step.componentId, step.toState)
    }
  }

  return {
    planId: plan.id,
    feasible: firstViolationIndex === -1,
    steps: stepResults,
  }
}

/**
 * Compute the effective state of each component at a given step index
 * (0-based, inclusive). Returns a map of componentId → stateId.
 */
export function getStateAtStep(
  plan: MigrationPlan,
  components: Component[],
  stepIndex: number,
): Map<ComponentId, StateId> {
  const state = new Map<ComponentId, StateId>()
  for (const c of components) {
    if (c.states.length > 0) state.set(c.id, c.states[0].id)
  }
  for (let i = 0; i <= Math.min(stepIndex, plan.steps.length - 1); i++) {
    const step = plan.steps[i]
    state.set(step.componentId, step.toState)
  }
  return state
}

/** Memoisation cache — keyed by planId + dep fingerprint */
const cache = new Map<string, PlanFeasibilityResult>()

function fingerprint(plan: MigrationPlan, dependencies: DependencyEdge[]): string {
  return JSON.stringify({ steps: plan.steps, deps: dependencies })
}

export function simulatePlanMemo(
  plan: MigrationPlan,
  dependencies: DependencyEdge[],
  components: Component[],
): PlanFeasibilityResult {
  const key = plan.id + '|' + fingerprint(plan, dependencies)
  if (cache.has(key)) return cache.get(key)!
  const result = simulatePlan(plan, dependencies, components)
  cache.set(key, result)
  return result
}

export function invalidatePlanCache(planId: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(planId + '|')) cache.delete(key)
  }
}

export function invalidateAllCache(): void {
  cache.clear()
}
