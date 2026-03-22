import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type {
  Project,
  Component,
  ComponentDefinition,
  ComponentId,
  DependencyEdge,
  EdgeId,
  MigrationPlan,
  PlanId,
  PlanStep,
  StateTransitionStep,
  StepId,
  ReleaseEntry,
  ReleaseStatus,
  ActiveView,
  NodePosition,
  Diagram,
  DiagramId,
  DiagramNodeBase,
  DiagramEdgeBase,
  DiagramPhase,
  PhaseId,
  PhaseState,
  NodeOverride,
  EdgeOverride,
} from '@/types'
import { generateId } from '@/lib/utils'
import { createEmptyProject, saveToLocalStorage, loadFromLocalStorage } from '@/lib/project-io'
import { DEMO_PROJECT } from '@/lib/demo-project'
import { getStepComponentIds } from '@/lib/plan-simulation'
import { invalidatePlanCache, invalidateAllCache } from '@/lib/feasibility'

// ─── State shape ──────────────────────────────────────────────────────────────

interface UIState {
  activeView: ActiveView
  activePlanId: PlanId | null
  selectedStepId: StepId | null
  comparisonPlanIds: PlanId[]
  nodePositions: Record<ComponentId, NodePosition>
  /** Whether current in-memory state differs from last file export */
  hasUnsavedChanges: boolean
  /** IDs of selected edges/nodes in the dependency graph */
  selectedEdgeId: EdgeId | null
  selectedComponentId: ComponentId | null
  /** Filter: which component rows are visible in timeline */
  visibleComponentIds: ComponentId[] | null // null = all visible
  /** Active diagram being viewed/edited */
  activeDiagramId: DiagramId | null
}

interface AppStore extends UIState {
  project: Project

  // ── Project-level ────────────────────────────────────────────────────────
  loadProject: (project: Project) => void
  newProject: (name?: string) => void
  markExported: () => void

  // ── Components ───────────────────────────────────────────────────────────
  addComponent: (component: Omit<Component, 'id'>) => Component
  updateComponent: (id: ComponentId, updates: Partial<Omit<Component, 'id'>>) => void
  deleteComponent: (id: ComponentId) => { ok: boolean; reason?: string }

  // ── Dependency edges ─────────────────────────────────────────────────────
  addDependencyEdge: (edge: Omit<DependencyEdge, 'id'>) => { ok: boolean; reason?: string; edge?: DependencyEdge }
  deleteDependencyEdge: (id: EdgeId) => void

  // ── Plans ────────────────────────────────────────────────────────────────
  addPlan: (name: string, description?: string) => { ok: boolean; reason?: string; plan?: MigrationPlan }
  updatePlan: (id: PlanId, updates: Partial<Pick<MigrationPlan, 'name' | 'description'>>) => void
  deletePlan: (id: PlanId) => void
  duplicatePlan: (id: PlanId) => MigrationPlan | null

  // ── Plan steps ───────────────────────────────────────────────────────────
  addStep: (planId: PlanId, step: Omit<StateTransitionStep, 'id'>) => { ok: boolean; reason?: string }
  addStructuralMergeStep: (
    planId: PlanId,
    data: { sourceIds: ComponentId[]; successorComponent: ComponentDefinition; notes?: string },
  ) => { ok: boolean; reason?: string }
  addStructuralSplitStep: (
    planId: PlanId,
    data: { sourceId: ComponentId; successorComponents: ComponentDefinition[]; notes?: string },
  ) => { ok: boolean; reason?: string }
  updateStep: (planId: PlanId, stepId: StepId, updates: Partial<Pick<StateTransitionStep, 'notes'>>) => void
  deleteStep: (planId: PlanId, stepId: StepId) => void
  reorderSteps: (planId: PlanId, fromIndex: number, toIndex: number) => void

  // ── Release tracking ──────────────────────────────────────────────────────
  setReleaseStatus: (componentId: ComponentId, fromState: string, toState: string, status: ReleaseStatus) => void

  // ── Diagrams ──────────────────────────────────────────────────────────────
  createDiagram: (name: string, type: Diagram['type']) => Diagram
  deleteDiagram: (id: DiagramId) => void
  updateDiagramElement: (
    diagramId: DiagramId,
    phase: PhaseId,
    update:
      | { kind: 'add-node'; node: DiagramNodeBase }
      | { kind: 'add-edge'; edge: DiagramEdgeBase }
      | { kind: 'remove-node'; nodeId: string }
      | { kind: 'remove-edge'; edgeId: string }
      | { kind: 'node-override'; override: NodeOverride }
      | { kind: 'edge-override'; override: EdgeOverride },
  ) => void
  setDiagramNodePosition: (diagramId: DiagramId, phase: PhaseId, nodeId: string, pos: { x: number; y: number }, manual: boolean) => void
  setActiveDiagram: (id: DiagramId | null) => void
  addDiagramPhase: (diagramId: DiagramId, label: string) => void
  renameDiagramPhase: (diagramId: DiagramId, phaseId: string, label: string) => void
  deleteDiagramPhase: (diagramId: DiagramId, phaseId: string) => void
  addSequenceParticipant: (diagramId: DiagramId, phase: PhaseId, participant: import('@/types').SequenceParticipant) => void
  addSequenceMessage: (diagramId: DiagramId, phase: PhaseId, message: import('@/types').SequenceMessage) => void
  reorderSequenceParticipants: (diagramId: DiagramId, phase: PhaseId, fromIdx: number, toIdx: number) => void

  // ── UI ────────────────────────────────────────────────────────────────────
  setActiveView: (view: ActiveView) => void
  setActivePlan: (id: PlanId | null) => void
  setSelectedStep: (id: StepId | null) => void
  setComparisonPlanIds: (ids: PlanId[]) => void
  setNodePosition: (componentId: ComponentId, pos: NodePosition) => void
  setSelectedEdge: (id: EdgeId | null) => void
  setSelectedComponent: (id: ComponentId | null) => void
  setVisibleComponentIds: (ids: ComponentId[] | null) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isDuplicateEdge(edges: DependencyEdge[], edge: Omit<DependencyEdge, 'id'>): boolean {
  return edges.some(
    (e) =>
      e.from === edge.from &&
      e.fromState === edge.fromState &&
      e.to === edge.to &&
      e.toState === edge.toState,
  )
}

/** Check if any plan step references the given component ID */
function isComponentUsedInSteps(plans: MigrationPlan[], componentId: ComponentId): boolean {
  return plans.some((p) =>
    p.steps.some((s) => getStepComponentIds(s).includes(componentId)),
  )
}

function emptyPhaseState(): PhaseState {
  return { addedNodes: [], addedEdges: [], nodeOverrides: [], edgeOverrides: [] }
}

function emptySequencePhaseState() {
  return { addedParticipants: [], addedMessages: [], hiddenParticipantIds: [], hiddenMessageIds: [] }
}

// ─── Store ────────────────────────────────────────────────────────────────────

const initialProject = loadFromLocalStorage() ?? DEMO_PROJECT

export const useStore = create<AppStore>()(
  subscribeWithSelector((set, get) => ({
    // ── Initial state ────────────────────────────────────────────────────────
    project: initialProject,
    activeView: 'dependency-graph',
    activePlanId: initialProject.plans[0]?.id ?? null,
    selectedStepId: null,
    comparisonPlanIds: [],
    nodePositions: {},
    hasUnsavedChanges: false,
    selectedEdgeId: null,
    selectedComponentId: null,
    visibleComponentIds: null,
    activeDiagramId: null,

    // ── Project-level ────────────────────────────────────────────────────────
    loadProject: (project) => {
      invalidateAllCache()
      set({
        project,
        activePlanId: project.plans[0]?.id ?? null,
        selectedStepId: null,
        comparisonPlanIds: [],
        nodePositions: {},
        hasUnsavedChanges: false,
        selectedEdgeId: null,
        selectedComponentId: null,
        visibleComponentIds: null,
        activeDiagramId: null,
      })
      saveToLocalStorage(project)
    },

    newProject: (name) => {
      const p = createEmptyProject(name)
      get().loadProject(p)
    },

    markExported: () => set({ hasUnsavedChanges: false }),

    // ── Components ───────────────────────────────────────────────────────────
    addComponent: (data) => {
      const component: Component = { ...data, id: generateId() }
      set((s) => {
        const project = { ...s.project, components: [...s.project.components, component] }
        saveToLocalStorage(project)
        return { project, hasUnsavedChanges: true }
      })
      return component
    },

    updateComponent: (id, updates) => {
      set((s) => {
        const components = s.project.components.map((c) =>
          c.id === id ? { ...c, ...updates } : c,
        )
        const project = { ...s.project, components }
        saveToLocalStorage(project)
        return { project, hasUnsavedChanges: true }
      })
    },

    deleteComponent: (id) => {
      const { project } = get()

      // Block deletion of migration-created components (task 5.3)
      const comp = project.components.find((c) => c.id === id)
      if (comp?.migrationCreated) {
        return {
          ok: false,
          reason:
            'This component was created by a structural migration step and cannot be deleted directly. Remove the owning step instead.',
        }
      }

      const usedInEdge = project.dependencies.some((e) => e.from === id || e.to === id)
      const usedInPlan = isComponentUsedInSteps(project.plans, id)
      if (usedInEdge || usedInPlan) {
        return {
          ok: false,
          reason: 'Component is referenced by dependency edges or plan steps. Remove those first.',
        }
      }
      set((s) => {
        const components = s.project.components.filter((c) => c.id !== id)
        const releases = s.project.releases.filter((r) => r.componentId !== id)
        const project = { ...s.project, components, releases }
        saveToLocalStorage(project)
        return { project, hasUnsavedChanges: true }
      })
      return { ok: true }
    },

    // ── Dependency edges ─────────────────────────────────────────────────────
    addDependencyEdge: (data) => {
      if (data.from === data.to) {
        return { ok: false, reason: 'A component cannot depend on itself.' }
      }
      const { project } = get()
      if (isDuplicateEdge(project.dependencies, data)) {
        return { ok: false, reason: 'This dependency edge already exists.' }
      }
      // Cycle detection: would adding this edge create a cycle?
      if (wouldCreateCycle(project.dependencies, data.from, data.to)) {
        return { ok: false, reason: 'Adding this edge would create a circular dependency.' }
      }
      const edge: DependencyEdge = { ...data, id: generateId() }
      set((s) => {
        const project = { ...s.project, dependencies: [...s.project.dependencies, edge] }
        saveToLocalStorage(project)
        return { project, hasUnsavedChanges: true }
      })
      return { ok: true, edge }
    },

    deleteDependencyEdge: (id) => {
      set((s) => {
        const project = { ...s.project, dependencies: s.project.dependencies.filter((e) => e.id !== id) }
        saveToLocalStorage(project)
        return { project, hasUnsavedChanges: true, selectedEdgeId: null }
      })
    },

    // ── Plans ────────────────────────────────────────────────────────────────
    addPlan: (name, description) => {
      const { project } = get()
      if (project.plans.some((p) => p.name === name)) {
        return { ok: false, reason: `A plan named "${name}" already exists.` }
      }
      const plan: MigrationPlan = { id: generateId(), name, steps: [], description }
      set((s) => {
        const project = { ...s.project, plans: [...s.project.plans, plan] }
        saveToLocalStorage(project)
        return { project, hasUnsavedChanges: true }
      })
      return { ok: true, plan }
    },

    updatePlan: (id, updates) => {
      set((s) => {
        const plans = s.project.plans.map((p) => (p.id === id ? { ...p, ...updates } : p))
        const project = { ...s.project, plans }
        saveToLocalStorage(project)
        return { project, hasUnsavedChanges: true }
      })
    },

    deletePlan: (id) => {
      set((s) => {
        const plans = s.project.plans.filter((p) => p.id !== id)
        const activePlanId = s.activePlanId === id ? (plans[0]?.id ?? null) : s.activePlanId
        const project = { ...s.project, plans }
        saveToLocalStorage(project)
        return { project, activePlanId, hasUnsavedChanges: true }
      })
    },

    duplicatePlan: (id) => {
      const { project } = get()
      const original = project.plans.find((p) => p.id === id)
      if (!original) return null
      const newPlan: MigrationPlan = {
        ...original,
        id: generateId(),
        name: `${original.name} (copy)`,
        steps: original.steps.map((s) => ({ ...s, id: generateId() })),
      }
      set((s) => {
        const project = { ...s.project, plans: [...s.project.plans, newPlan] }
        saveToLocalStorage(project)
        return { project, hasUnsavedChanges: true }
      })
      return newPlan
    },

    // ── Plan steps ───────────────────────────────────────────────────────────
    addStep: (planId, stepData) => {
      if (stepData.fromState === stepData.toState) {
        return { ok: false, reason: 'fromState and toState must be different.' }
      }
      const step: PlanStep = { ...stepData, id: generateId() }
      set((s) => {
        const plans = s.project.plans.map((p) =>
          p.id === planId ? { ...p, steps: [...p.steps, step] } : p,
        )
        const project = { ...s.project, plans }
        saveToLocalStorage(project)
        invalidatePlanCache(planId)
        return { project, hasUnsavedChanges: true }
      })
      return { ok: true }
    },

    addStructuralMergeStep: (planId, data) => {
      // Validate: at least 2 sources
      if (data.sourceIds.length < 2) {
        return { ok: false, reason: 'A merge step requires at least 2 source components.' }
      }
      const { project } = get()
      const plan = project.plans.find((p) => p.id === planId)
      if (!plan) return { ok: false, reason: 'Plan not found.' }

      // Validate: successor name unique
      const successorName = data.successorComponent.name.trim()
      if (!successorName) return { ok: false, reason: 'Successor component name is required.' }
      if (project.components.some((c) => c.name === successorName)) {
        return { ok: false, reason: `A component named "${successorName}" already exists.` }
      }

      const stepIndex = plan.steps.length
      const successorId = generateId()
      const step: PlanStep = {
        id: generateId(),
        type: 'structural-merge',
        sourceIds: data.sourceIds,
        successorId,
        successorComponent: data.successorComponent,
        notes: data.notes,
      }

      // Create successor component with migrationCreated metadata (task 6.7)
      const successorComp: Component = {
        ...data.successorComponent,
        id: successorId,
        migrationCreated: { planId, stepIndex },
      }

      set((s) => {
        const plans = s.project.plans.map((p) =>
          p.id === planId ? { ...p, steps: [...p.steps, step] } : p,
        )
        const components = [...s.project.components, successorComp]
        const newProject = { ...s.project, plans, components }
        saveToLocalStorage(newProject)
        invalidatePlanCache(planId)
        return { project: newProject, hasUnsavedChanges: true }
      })
      return { ok: true }
    },

    addStructuralSplitStep: (planId, data) => {
      // Validate: at least 2 successors
      if (data.successorComponents.length < 2) {
        return { ok: false, reason: 'A split step requires at least 2 successor components.' }
      }
      const { project } = get()
      const plan = project.plans.find((p) => p.id === planId)
      if (!plan) return { ok: false, reason: 'Plan not found.' }

      // Validate: all successor names unique and not already existing
      const names = data.successorComponents.map((c) => c.name.trim())
      for (const name of names) {
        if (!name) return { ok: false, reason: 'All successor component names are required.' }
        if (project.components.some((c) => c.name === name)) {
          return { ok: false, reason: `A component named "${name}" already exists.` }
        }
      }
      const uniqueNames = new Set(names)
      if (uniqueNames.size !== names.length) {
        return { ok: false, reason: 'All successor component names must be unique.' }
      }

      const stepIndex = plan.steps.length
      const successorIds = data.successorComponents.map(() => generateId())
      const step: PlanStep = {
        id: generateId(),
        type: 'structural-split',
        sourceId: data.sourceId,
        successorIds,
        successorComponents: data.successorComponents,
        notes: data.notes,
      }

      // Create successor components with migrationCreated metadata (task 6.7)
      const successorComps: Component[] = data.successorComponents.map((def, idx) => ({
        ...def,
        id: successorIds[idx],
        migrationCreated: { planId, stepIndex },
      }))

      set((s) => {
        const plans = s.project.plans.map((p) =>
          p.id === planId ? { ...p, steps: [...p.steps, step] } : p,
        )
        const components = [...s.project.components, ...successorComps]
        const newProject = { ...s.project, plans, components }
        saveToLocalStorage(newProject)
        invalidatePlanCache(planId)
        return { project: newProject, hasUnsavedChanges: true }
      })
      return { ok: true }
    },

    updateStep: (planId, stepId, updates) => {
      set((s) => {
        const plans = s.project.plans.map((p) =>
          p.id === planId
            ? { ...p, steps: p.steps.map((st) => (st.id === stepId ? { ...st, ...updates } : st)) }
            : p,
        )
        const project = { ...s.project, plans }
        saveToLocalStorage(project)
        invalidatePlanCache(planId)
        return { project, hasUnsavedChanges: true }
      })
    },

    deleteStep: (planId, stepId) => {
      const { project } = get()
      const plan = project.plans.find((p) => p.id === planId)
      const step = plan?.steps.find((s) => s.id === stepId)

      // Collect successor component IDs owned by this structural step (task 6.8)
      const ownedSuccessorIds: ComponentId[] = []
      if (step?.type === 'structural-merge') {
        ownedSuccessorIds.push(step.successorId)
      } else if (step?.type === 'structural-split') {
        ownedSuccessorIds.push(...step.successorIds)
      }

      set((s) => {
        const newPlans = s.project.plans.map((p) =>
          p.id === planId ? { ...p, steps: p.steps.filter((st) => st.id !== stepId) } : p,
        )

        // Remove migration-created successors no longer referenced (task 6.8)
        let components = s.project.components
        if (ownedSuccessorIds.length > 0) {
          const allRemainingSteps = newPlans.flatMap((p) => p.steps)
          const remainingRefs = new Set(allRemainingSteps.flatMap(getStepComponentIds))
          components = components.filter(
            (c) => !ownedSuccessorIds.includes(c.id) || remainingRefs.has(c.id),
          )
        }

        const newProject = { ...s.project, plans: newPlans, components }
        saveToLocalStorage(newProject)
        invalidatePlanCache(planId)
        return { project: newProject, hasUnsavedChanges: true, selectedStepId: null }
      })
    },

    reorderSteps: (planId, fromIndex, toIndex) => {
      set((s) => {
        const plans = s.project.plans.map((p) => {
          if (p.id !== planId) return p
          const steps = [...p.steps]
          const [moved] = steps.splice(fromIndex, 1)
          steps.splice(toIndex, 0, moved)
          return { ...p, steps }
        })
        const project = { ...s.project, plans }
        saveToLocalStorage(project)
        invalidatePlanCache(planId)
        return { project, hasUnsavedChanges: true }
      })
    },

    // ── Release tracking ──────────────────────────────────────────────────────
    setReleaseStatus: (componentId, fromState, toState, status) => {
      set((s) => {
        const existing = s.project.releases.filter(
          (r) => !(r.componentId === componentId && r.fromState === fromState && r.toState === toState),
        )
        const updated: ReleaseEntry[] =
          status === 'untracked'
            ? existing
            : [...existing, { componentId, fromState, toState, status }]
        const project = { ...s.project, releases: updated }
        saveToLocalStorage(project)
        return { project, hasUnsavedChanges: true }
      })
    },

    // ── Diagrams ──────────────────────────────────────────────────────────────
    createDiagram: (name, type) => {
      const diagram: Diagram = {
        id: generateId(),
        name,
        type,
        baseNodes: [],
        baseEdges: [],
        phases: {},
        ...(type === 'sequence' ? { baseParticipants: [], baseMessages: [], sequencePhases: {} } : {}),
      }
      set((s) => {
        const diagrams = [...(s.project.diagrams ?? []), diagram]
        const project = { ...s.project, diagrams }
        saveToLocalStorage(project)
        return { project, hasUnsavedChanges: true }
      })
      return diagram
    },

    deleteDiagram: (id) => {
      set((s) => {
        const diagrams = (s.project.diagrams ?? []).filter((d) => d.id !== id)
        const project = { ...s.project, diagrams }
        saveToLocalStorage(project)
        return {
          project,
          hasUnsavedChanges: true,
          activeDiagramId: s.activeDiagramId === id ? null : s.activeDiagramId,
        }
      })
    },

    updateDiagramElement: (diagramId, phase, update) => {
      set((s) => {
        const diagrams = (s.project.diagrams ?? []).map((d) => {
          if (d.id !== diagramId) return d
          const isBase = phase === 'as-is'
          if (update.kind === 'add-node') {
            if (isBase) return { ...d, baseNodes: [...d.baseNodes, update.node] }
            const ps = d.phases[phase] ?? emptyPhaseState()
            return { ...d, phases: { ...d.phases, [phase]: { ...ps, addedNodes: [...ps.addedNodes, update.node] } } }
          }
          if (update.kind === 'add-edge') {
            if (isBase) return { ...d, baseEdges: [...d.baseEdges, update.edge] }
            const ps = d.phases[phase] ?? emptyPhaseState()
            return { ...d, phases: { ...d.phases, [phase]: { ...ps, addedEdges: [...ps.addedEdges, update.edge] } } }
          }
          if (update.kind === 'remove-node') {
            if (isBase) return { ...d, baseNodes: d.baseNodes.filter((n) => n.id !== update.nodeId), baseEdges: d.baseEdges.filter((e) => e.source !== update.nodeId && e.target !== update.nodeId) }
            const ps = d.phases[phase] ?? emptyPhaseState()
            return { ...d, phases: { ...d.phases, [phase]: { ...ps, addedNodes: ps.addedNodes.filter((n) => n.id !== update.nodeId) } } }
          }
          if (update.kind === 'remove-edge') {
            if (isBase) return { ...d, baseEdges: d.baseEdges.filter((e) => e.id !== update.edgeId) }
            const ps = d.phases[phase] ?? emptyPhaseState()
            return { ...d, phases: { ...d.phases, [phase]: { ...ps, addedEdges: ps.addedEdges.filter((e) => e.id !== update.edgeId) } } }
          }
          if (update.kind === 'node-override') {
            // as-is phase: overrides are never applied during resolution — update base directly
            if (isBase && update.override.action === 'modify') {
              return {
                ...d,
                baseNodes: d.baseNodes.map((n) =>
                  n.id !== update.override.nodeId ? n : {
                    ...n,
                    ...(update.override.label !== undefined ? { label: update.override.label } : {}),
                    ...(update.override.description !== undefined ? { description: update.override.description } : {}),
                  }
                ),
              }
            }
            const ps = d.phases[phase] ?? emptyPhaseState()
            const overrides = ps.nodeOverrides.filter((o) => o.nodeId !== update.override.nodeId)
            return { ...d, phases: { ...d.phases, [phase]: { ...ps, nodeOverrides: [...overrides, update.override] } } }
          }
          if (update.kind === 'edge-override') {
            // as-is phase: update base edge directly
            if (isBase && update.override.action === 'modify') {
              return {
                ...d,
                baseEdges: d.baseEdges.map((e) =>
                  e.id !== update.override.edgeId ? e : {
                    ...e,
                    ...(update.override.label !== undefined ? { label: update.override.label } : {}),
                  }
                ),
              }
            }
            const ps = d.phases[phase] ?? emptyPhaseState()
            const overrides = ps.edgeOverrides.filter((o) => o.edgeId !== update.override.edgeId)
            return { ...d, phases: { ...d.phases, [phase]: { ...ps, edgeOverrides: [...overrides, update.override] } } }
          }
          return d
        })
        const project = { ...s.project, diagrams }
        saveToLocalStorage(project)
        return { project, hasUnsavedChanges: true }
      })
    },

    setDiagramNodePosition: (diagramId, phase, nodeId, pos, manual) => {
      set((s) => {
        const diagrams = (s.project.diagrams ?? []).map((d) => {
          if (d.id !== diagramId) return d
          const isBase = phase === 'as-is'
          const updateNode = (node: DiagramNodeBase) =>
            node.id === nodeId ? { ...node, position: pos, manuallyPositioned: manual || node.manuallyPositioned } : node
          if (isBase) {
            return { ...d, baseNodes: d.baseNodes.map(updateNode) }
          }
          const ps = d.phases[phase] ?? emptyPhaseState()
          return {
            ...d,
            phases: {
              ...d.phases,
              [phase]: { ...ps, addedNodes: ps.addedNodes.map(updateNode) },
            },
          }
        })
        const project = { ...s.project, diagrams }
        saveToLocalStorage(project)
        return { project, hasUnsavedChanges: true }
      })
    },

    setActiveDiagram: (id) => set({ activeDiagramId: id }),

    addDiagramPhase: (diagramId, label) => {
      set((s) => {
        const diagrams = (s.project.diagrams ?? []).map((d) => {
          if (d.id !== diagramId) return d
          const current = d.phaseOrder && d.phaseOrder.length > 0
            ? d.phaseOrder
            : [{ id: 'as-is', label: 'As-Is' }, { id: 'phase-1', label: 'Phase 1' }, { id: 'phase-2', label: 'Phase 2' }]
          const newPhase: DiagramPhase = { id: generateId(), label }
          return { ...d, phaseOrder: [...current, newPhase] }
        })
        const project = { ...s.project, diagrams }
        saveToLocalStorage(project)
        return { project, hasUnsavedChanges: true }
      })
    },

    renameDiagramPhase: (diagramId, phaseId, label) => {
      set((s) => {
        const diagrams = (s.project.diagrams ?? []).map((d) => {
          if (d.id !== diagramId) return d
          const phaseOrder = (d.phaseOrder ?? []).map((p) => p.id === phaseId ? { ...p, label } : p)
          return { ...d, phaseOrder }
        })
        const project = { ...s.project, diagrams }
        saveToLocalStorage(project)
        return { project, hasUnsavedChanges: true }
      })
    },

    deleteDiagramPhase: (diagramId, phaseId) => {
      set((s) => {
        const diagrams = (s.project.diagrams ?? []).map((d) => {
          if (d.id !== diagramId) return d
          const phaseOrder = d.phaseOrder ?? []
          if (phaseOrder.length === 0 || phaseOrder[0]?.id === phaseId) return d // no-op on base phase
          const newPhaseOrder = phaseOrder.filter((p) => p.id !== phaseId)
          const { [phaseId]: _removedPhase, ...remainingPhases } = d.phases
          const remainingSeqPhases = d.sequencePhases
            ? Object.fromEntries(Object.entries(d.sequencePhases).filter(([k]) => k !== phaseId))
            : undefined
          return {
            ...d,
            phaseOrder: newPhaseOrder,
            phases: remainingPhases,
            ...(remainingSeqPhases !== undefined ? { sequencePhases: remainingSeqPhases } : {}),
          }
        })
        const project = { ...s.project, diagrams }
        saveToLocalStorage(project)
        return { project, hasUnsavedChanges: true }
      })
    },

    addSequenceParticipant: (diagramId, phase, participant) => {
      set((s) => {
        const diagrams = (s.project.diagrams ?? []).map((d) => {
          if (d.id !== diagramId) return d
          if (phase === 'as-is') {
            return { ...d, baseParticipants: [...(d.baseParticipants ?? []), participant] }
          }
          const sp = d.sequencePhases?.[phase] ?? emptySequencePhaseState()
          return { ...d, sequencePhases: { ...d.sequencePhases, [phase]: { ...sp, addedParticipants: [...sp.addedParticipants, participant] } } }
        })
        const project = { ...s.project, diagrams }
        saveToLocalStorage(project)
        return { project, hasUnsavedChanges: true }
      })
    },

    addSequenceMessage: (diagramId, phase, message) => {
      set((s) => {
        const diagrams = (s.project.diagrams ?? []).map((d) => {
          if (d.id !== diagramId) return d
          if (phase === 'as-is') {
            return { ...d, baseMessages: [...(d.baseMessages ?? []), message] }
          }
          const sp = d.sequencePhases?.[phase] ?? emptySequencePhaseState()
          return { ...d, sequencePhases: { ...d.sequencePhases, [phase]: { ...sp, addedMessages: [...sp.addedMessages, message] } } }
        })
        const project = { ...s.project, diagrams }
        saveToLocalStorage(project)
        return { project, hasUnsavedChanges: true }
      })
    },

    reorderSequenceParticipants: (diagramId, phase, fromIdx, toIdx) => {
      set((s) => {
        const diagrams = (s.project.diagrams ?? []).map((d) => {
          if (d.id !== diagramId) return d
          const getAll = () => {
            const PHASES: PhaseId[] = ['as-is', 'phase-1', 'phase-2']
            let ps = [...(d.baseParticipants ?? [])]
            const phaseIdx = PHASES.indexOf(phase)
            for (let i = 1; i <= phaseIdx; i++) {
              const sp = d.sequencePhases?.[PHASES[i]]
              if (sp) ps = [...ps, ...sp.addedParticipants].filter((p) => !sp.hiddenParticipantIds.includes(p.id))
            }
            return ps.sort((a, b) => a.order - b.order)
          }
          const all = getAll()
          const moved = all[fromIdx]
          if (!moved) return d
          const reordered = [...all]
          reordered.splice(fromIdx, 1)
          reordered.splice(toIdx, 0, moved)
          const withOrders = reordered.map((p, i) => ({ ...p, order: i }))
          // Rewrite baseParticipants with new orders
          const baseIds = new Set((d.baseParticipants ?? []).map((p) => p.id))
          const newBase = withOrders.filter((p) => baseIds.has(p.id))
          return { ...d, baseParticipants: newBase }
        })
        const project = { ...s.project, diagrams }
        saveToLocalStorage(project)
        return { project, hasUnsavedChanges: true }
      })
    },

    // ── UI ────────────────────────────────────────────────────────────────────
    setActiveView: (view) => set({ activeView: view }),
    setActivePlan: (id) => set({ activePlanId: id, selectedStepId: null }),
    setSelectedStep: (id) => set({ selectedStepId: id }),
    setComparisonPlanIds: (ids) => set({ comparisonPlanIds: ids }),
    setNodePosition: (componentId, pos) =>
      set((s) => ({ nodePositions: { ...s.nodePositions, [componentId]: pos } })),
    setSelectedEdge: (id) => set({ selectedEdgeId: id }),
    setSelectedComponent: (id) => set({ selectedComponentId: id }),
    setVisibleComponentIds: (ids) => set({ visibleComponentIds: ids }),
  })),
)

// ─── Cycle detection ──────────────────────────────────────────────────────────

function wouldCreateCycle(edges: DependencyEdge[], newFrom: ComponentId, newTo: ComponentId): boolean {
  // Build adjacency list (component-level: ignores states for cycle check)
  const adj: Map<ComponentId, Set<ComponentId>> = new Map()
  for (const e of edges) {
    if (!adj.has(e.from)) adj.set(e.from, new Set())
    adj.get(e.from)!.add(e.to)
  }
  // Check if newTo can reach newFrom (meaning adding newFrom→newTo would close a cycle)
  const visited = new Set<ComponentId>()
  const stack = [newTo]
  while (stack.length > 0) {
    const node = stack.pop()!
    if (node === newFrom) return true
    if (visited.has(node)) continue
    visited.add(node)
    const neighbours = adj.get(node)
    if (neighbours) for (const n of neighbours) stack.push(n)
  }
  return false
}
