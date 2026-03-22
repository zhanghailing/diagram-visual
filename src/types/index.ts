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
  /** Set when this component was auto-created by a structural migration step */
  migrationCreated?: { planId: PlanId; stepIndex: number }
}

/** The data needed to define a new component inline (without an id) */
export interface ComponentDefinition {
  name: string
  type: ComponentType
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

export interface StateTransitionStep {
  id: StepId
  type: 'state-transition'
  componentId: ComponentId
  fromState: StateId
  toState: StateId
  notes?: string
}

export interface StructuralMergeStep {
  id: StepId
  type: 'structural-merge'
  /** Source component IDs being retired (2+) */
  sourceIds: ComponentId[]
  /** ID of the newly-created successor component */
  successorId: ComponentId
  /** Inline definition of the successor component */
  successorComponent: ComponentDefinition
  notes?: string
}

export interface StructuralSplitStep {
  id: StepId
  type: 'structural-split'
  /** Source component ID being retired */
  sourceId: ComponentId
  /** IDs of the newly-created successor components (2+) */
  successorIds: ComponentId[]
  /** Inline definitions of the successor components */
  successorComponents: ComponentDefinition[]
  notes?: string
}

/** Discriminated union of all plan step types */
export type PlanStep = StateTransitionStep | StructuralMergeStep | StructuralSplitStep

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
  version: 2
  name: string
  components: Component[]
  dependencies: DependencyEdge[]
  plans: MigrationPlan[]
  releases: ReleaseEntry[]
  diagrams?: Diagram[]
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
  | 'diagrams'

export interface NodePosition {
  x: number
  y: number
}

// ─── Diagram authoring ────────────────────────────────────────────────────────

export type DiagramId = string
export type DiagramNodeId = string
export type DiagramEdgeId = string
export type PhaseId = string
export type DiagramType = 'c4-component' | 'architecture' | 'sequence'

export interface DiagramPhase {
  id: string
  label: string
}

export interface DiagramNodeBase {
  id: DiagramNodeId
  /** Node subtype: c4-person | c4-system | c4-container | c4-component | box | database | actor | queue */
  nodeType: string
  label: string
  description?: string
  position: { x: number; y: number }
  /** True when the user has manually dragged this node — suppresses auto-layout */
  manuallyPositioned?: boolean
}

export interface DiagramEdgeBase {
  id: DiagramEdgeId
  source: DiagramNodeId
  target: DiagramNodeId
  label?: string
  /** C4 Rel technology annotation */
  technology?: string
  /** Custom label position offset (pixels) from the computed midpoint */
  labelOffset?: { x: number; y: number }
}

export type OverrideAction = 'hide' | 'modify'

export interface NodeOverride {
  nodeId: DiagramNodeId
  action: OverrideAction
  label?: string
  description?: string
  position?: { x: number; y: number }
  manuallyPositioned?: boolean
}

export interface EdgeOverride {
  edgeId: DiagramEdgeId
  action: OverrideAction
  label?: string
}

export interface PhaseState {
  /** Nodes introduced for the first time in this phase */
  addedNodes: DiagramNodeBase[]
  /** Edges introduced for the first time in this phase */
  addedEdges: DiagramEdgeBase[]
  nodeOverrides: NodeOverride[]
  edgeOverrides: EdgeOverride[]
}

// Sequence diagram

export interface SequenceParticipant {
  id: string
  label: string
  /** Display order (0-based) */
  order: number
}

export interface SequenceMessage {
  id: string
  from: string
  to: string
  label: string
  /** Display order (0-based) */
  order: number
}

export interface SequencePhaseState {
  addedParticipants: SequenceParticipant[]
  addedMessages: SequenceMessage[]
  hiddenParticipantIds: string[]
  hiddenMessageIds: string[]
}

export interface Diagram {
  id: DiagramId
  name: string
  type: DiagramType
  /** Base elements defined in the as-is phase */
  baseNodes: DiagramNodeBase[]
  baseEdges: DiagramEdgeBase[]
  /** Per-phase overrides and additions */
  phases: Partial<Record<PhaseId, PhaseState>>
  /** User-defined ordered phase list. If absent, defaults to the 3-phase legacy list. */
  phaseOrder?: DiagramPhase[]
  /** Sequence-diagram base participants/messages (only used when type === 'sequence') */
  baseParticipants?: SequenceParticipant[]
  baseMessages?: SequenceMessage[]
  sequencePhases?: Partial<Record<PhaseId, SequencePhaseState>>
}
