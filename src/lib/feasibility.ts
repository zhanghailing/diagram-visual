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
 * Simulate a migration plan step-by-step, returning feasibility results.
 *
 * For state-transition steps:
 * 1. Retirement constraint: check the target component is not already retired
 * 2. Dependency constraint: check all gating edges are satisfied
 *
 * For structural steps:
 * 1. Dependent constraint: check no active dependent of a retiring component
 *    is still unresolved (i.e., has not yet satisfied its dependency on the retiring component)
 *
 * Once a violation occurs, all subsequent steps are "unvalidated".
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

  // Lifecycle tracking for retirement constraints
  const retired = new Set<ComponentId>()
  // Maps retired component ID → successor ID(s)
  const successorMap = new Map<ComponentId, ComponentId | ComponentId[]>()
  // Tracks which step retired each component (for error messages)
  const retiredAtStep = new Map<ComponentId, number>()

  const stepResults: StepResult[] = []
  let firstViolationIndex = -1

  for (let i = 0; i < plan.steps.length; i++) {
    const step = plan.steps[i]

    if (firstViolationIndex !== -1) {
      stepResults.push({ stepId: step.id, status: 'unvalidated' })
      continue
    }

    let violation: string | undefined

    if (step.type === 'state-transition') {
      // ── Retirement constraint (4.1) ────────────────────────────────────────
      if (retired.has(step.componentId)) {
        const retiredStep = retiredAtStep.get(step.componentId)
        const comp = components.find((c) => c.id === step.componentId)
        const name = comp?.name ?? step.componentId
        violation = `Component "${name}" has been retired at step ${(retiredStep ?? 0) + 1} and cannot be transitioned`
      }

      if (!violation) {
        // ── Dependency constraint (existing logic) ──────────────────────────
        // When checking edges, redirect from retired components to their successors
        const gatingEdges = dependencies.filter(
          (e) => e.to === step.componentId && e.toState === step.toState,
        )

        for (const edge of gatingEdges) {
          // Resolve the "from" component through the successor map (edge redirection — 4.3)
          const resolvedFromId = resolveEdgeFrom(edge.from, successorMap)

          const depCurrentState = currentState.get(resolvedFromId)
          const depComponent = components.find((c) => c.id === resolvedFromId)
          const depStateList = depComponent?.states ?? []
          const depCurrentIndex = depStateList.findIndex((s) => s.id === depCurrentState)
          const requiredIndex = depStateList.findIndex((s) => s.id === edge.fromState)

          if (depCurrentIndex < requiredIndex) {
            const depName = depComponent?.name ?? resolvedFromId
            const requiredStateName =
              depStateList.find((s) => s.id === edge.fromState)?.name ?? edge.fromState
            violation = `Requires "${depName}" to be in state "${requiredStateName}" first`
            break
          }
        }
      }

      if (violation) {
        stepResults.push({ stepId: step.id, status: 'violation', reason: violation })
        firstViolationIndex = i
      } else {
        stepResults.push({ stepId: step.id, status: 'ok' })
        currentState.set(step.componentId, step.toState)
      }
    } else if (step.type === 'structural-merge') {
      // ── Structural merge: check for unresolved dependents (4.2) ───────────
      for (const srcId of step.sourceIds) {
        if (violation) break
        const srcComp = components.find((c) => c.id === srcId)
        const srcName = srcComp?.name ?? srcId

        // Find all edges where srcId is the prerequisite component
        const dependentEdges = dependencies.filter((e) => e.from === srcId)
        for (const edge of dependentEdges) {
          // Find the dependent component B
          const depComp = components.find((c) => c.id === edge.to)
          const depName = depComp?.name ?? edge.to

          // Check if B has already reached the state that requires srcId
          const depCurrentState = currentState.get(edge.to)
          const depStateList = depComp?.states ?? []
          const depCurrentIndex = depStateList.findIndex((s) => s.id === depCurrentState)
          const requiredIndex = depStateList.findIndex((s) => s.id === edge.toState)

          // If B hasn't yet made the transition that depends on srcId, it's unresolved
          if (depCurrentIndex < requiredIndex) {
            violation = `Component "${depName}" still depends on "${srcName}" which is being retired; its dependency must be resolved before this step`
            break
          }
        }
      }

      if (violation) {
        stepResults.push({ stepId: step.id, status: 'violation', reason: violation })
        firstViolationIndex = i
      } else {
        stepResults.push({ stepId: step.id, status: 'ok' })
        // Apply edge redirection: retire sources, activate successor (4.3)
        for (const srcId of step.sourceIds) {
          retired.add(srcId)
          retiredAtStep.set(srcId, i)
          successorMap.set(srcId, step.successorId)
        }
        // Successor starts in its first state
        const successorComp = components.find((c) => c.id === step.successorId)
        if (successorComp && successorComp.states.length > 0) {
          currentState.set(step.successorId, successorComp.states[0].id)
        }
      }
    } else if (step.type === 'structural-split') {
      // ── Structural split: check for unresolved dependents (4.2) ──────────
      const srcId = step.sourceId
      const srcComp = components.find((c) => c.id === srcId)
      const srcName = srcComp?.name ?? srcId

      const dependentEdges = dependencies.filter((e) => e.from === srcId)
      for (const edge of dependentEdges) {
        const depComp = components.find((c) => c.id === edge.to)
        const depName = depComp?.name ?? edge.to

        const depCurrentState = currentState.get(edge.to)
        const depStateList = depComp?.states ?? []
        const depCurrentIndex = depStateList.findIndex((s) => s.id === depCurrentState)
        const requiredIndex = depStateList.findIndex((s) => s.id === edge.toState)

        if (depCurrentIndex < requiredIndex) {
          violation = `Component "${depName}" still depends on "${srcName}" which is being retired; its dependency must be resolved before this step`
          break
        }
      }

      if (violation) {
        stepResults.push({ stepId: step.id, status: 'violation', reason: violation })
        firstViolationIndex = i
      } else {
        stepResults.push({ stepId: step.id, status: 'ok' })
        // Apply edge redirection: retire source, activate successors (4.3)
        retired.add(srcId)
        retiredAtStep.set(srcId, i)
        successorMap.set(srcId, step.successorIds)
        for (const sucId of step.successorIds) {
          const sucComp = components.find((c) => c.id === sucId)
          if (sucComp && sucComp.states.length > 0) {
            currentState.set(sucId, sucComp.states[0].id)
          }
        }
      }
    }
  }

  return {
    planId: plan.id,
    feasible: firstViolationIndex === -1,
    steps: stepResults,
  }
}

/**
 * Resolve an edge's "from" component ID through the successor map.
 * If the component has been retired via a merge, returns the single successor.
 * For split successors (multiple), returns the first one (best effort — the
 * edge should have been resolved by a prior user action in practice).
 */
function resolveEdgeFrom(
  fromId: ComponentId,
  successorMap: Map<ComponentId, ComponentId | ComponentId[]>,
): ComponentId {
  const successor = successorMap.get(fromId)
  if (!successor) return fromId
  if (Array.isArray(successor)) return successor[0] // first successor for splits
  return successor
}

/**
 * Compute the effective state of each component at a given step index
 * (0-based, inclusive). Returns a map of componentId → stateId.
 * Structural steps are skipped — they don't advance an individual state.
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
    if (step.type !== 'state-transition') continue
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
