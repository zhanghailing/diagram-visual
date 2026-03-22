import type { MigrationPlan, Component, ComponentId } from '@/types'

// ─── Lifecycle state ──────────────────────────────────────────────────────────

export interface LifecycleState {
  /** Component IDs that are currently active (not retired) after the given step */
  active: Set<ComponentId>
  /** Component IDs that have been retired by a structural step at or before the given step */
  retired: Set<ComponentId>
  /**
   * Maps each retired component ID to its successor(s):
   * - structural-merge: retiredId → successorId (string)
   * - structural-split: retiredId → successorId[] (string[])
   */
  successorMap: Map<ComponentId, ComponentId | ComponentId[]>
}

// ─── simulatePlanUpTo ─────────────────────────────────────────────────────────

/**
 * Simulate a migration plan up to and including `stepIndex`, returning the
 * component lifecycle state after applying those steps.
 *
 * - `active`: all components active after applying steps 0..stepIndex
 *   (original components that haven't been retired + successor components
 *   introduced at or before stepIndex)
 * - `retired`: source components retired by structural steps at or before stepIndex
 * - `successorMap`: maps each retired component ID to its successor ID(s)
 *
 * State-transition steps do not change lifecycle — only structural steps do.
 * Call with stepIndex = -1 to get the initial state (all original components active).
 */
export function simulatePlanUpTo(
  plan: MigrationPlan,
  components: Component[],
  stepIndex: number,
): LifecycleState {
  // Start with all registered components active
  const active = new Set<ComponentId>(components.map((c) => c.id))
  const retired = new Set<ComponentId>()
  const successorMap = new Map<ComponentId, ComponentId | ComponentId[]>()

  const limit = Math.min(stepIndex, plan.steps.length - 1)

  for (let i = 0; i <= limit; i++) {
    const step = plan.steps[i]

    if (step.type === 'structural-merge') {
      // Retire all source components, introduce the successor
      for (const srcId of step.sourceIds) {
        active.delete(srcId)
        retired.add(srcId)
        successorMap.set(srcId, step.successorId)
      }
      active.add(step.successorId)
    } else if (step.type === 'structural-split') {
      // Retire the source component, introduce all successors
      active.delete(step.sourceId)
      retired.add(step.sourceId)
      successorMap.set(step.sourceId, step.successorIds)
      for (const sucId of step.successorIds) {
        active.add(sucId)
      }
    }
    // state-transition steps do not affect lifecycle
  }

  return { active, retired, successorMap }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Resolve a component ID through the successor map.
 * If `id` has been retired, returns its successor ID(s).
 * Returns `id` unchanged if it is not retired.
 */
export function resolveSuccessor(
  id: ComponentId,
  successorMap: Map<ComponentId, ComponentId | ComponentId[]>,
): ComponentId | ComponentId[] {
  return successorMap.get(id) ?? id
}

/**
 * Collect all component IDs referenced by any step in `steps`
 * (for determining whether a component is still in use after step deletion).
 */
export function getStepComponentIds(step: MigrationPlan['steps'][number]): ComponentId[] {
  if (step.type === 'state-transition') return [step.componentId]
  if (step.type === 'structural-merge') return [...step.sourceIds, step.successorId]
  if (step.type === 'structural-split') return [step.sourceId, ...step.successorIds]
  return []
}
