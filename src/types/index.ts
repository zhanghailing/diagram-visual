// ─── Core identifiers ────────────────────────────────────────────────────────

export type ComponentId = string
export type StateId = string
export type PlanId = string
export type EdgeId = string
export type StepId = string

// ─── Component ───────────────────────────────────────────────────────────────

export type ComponentType =
  | 'frontend'
  | 'backend'
  | 'library'
  | 'gateway'
  | 'platform'
  | 'other'

export interface ComponentState {
  id: StateId
  name: string
  description?: string
}

export interface Component {
  id: ComponentId
  name: string
  type: ComponentType
  /** Ordered list — index 0 is the "initial" state */
  states: ComponentState[]
  description?: string
}

// ─── Dependency edges ─────────────────────────────────────────────────────────

/**
 * Directed dependency edge meaning:
 * "Component `to` can only enter state `toState` if component `from`
 *  is already in (or has passed) state `fromState`."
 */
export interface DependencyEdge {
  id: EdgeId
  from: ComponentId
  fromState: StateId
  to: ComponentId
  toState: StateId
}

// ─── Migration plan ───────────────────────────────────────────────────────────

export interface PlanStep {
  id: StepId
  componentId: ComponentId
  fromState: StateId
  toState: StateId
  notes?: string
}

export interface MigrationPlan {
  id: PlanId
  name: string
  steps: PlanStep[]
  description?: string
}

// ─── Release tracking ─────────────────────────────────────────────────────────

export type ReleaseStatus = 'untracked' | 'implemented' | 'released'

export interface ReleaseEntry {
  componentId: ComponentId
  fromState: StateId
  toState: StateId
  status: ReleaseStatus
}

// ─── Project (root document) ──────────────────────────────────────────────────

export interface Project {
  /** Schema version for future migrations */
  version: 1
  name: string
  components: Component[]
  dependencies: DependencyEdge[]
  plans: MigrationPlan[]
  releases: ReleaseEntry[]
}

// ─── Feasibility analysis ─────────────────────────────────────────────────────

export type StepFeasibility = 'ok' | 'violation' | 'unvalidated'

export interface StepResult {
  stepId: StepId
  status: StepFeasibility
  reason?: string
}

export interface PlanFeasibilityResult {
  planId: PlanId
  feasible: boolean
  steps: StepResult[]
}

// ─── UI state ─────────────────────────────────────────────────────────────────

export type ActiveView =
  | 'dependency-graph'
  | 'plan-timeline'
  | 'plan-comparison'
  | 'release-tracker'
  | 'live-state'

export interface NodePosition {
  x: number
  y: number
}
