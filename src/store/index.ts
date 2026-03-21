import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type {
  Project,
  Component,
  ComponentId,
  DependencyEdge,
  EdgeId,
  MigrationPlan,
  PlanId,
  PlanStep,
  StepId,
  ReleaseEntry,
  ReleaseStatus,
  ActiveView,
  NodePosition,
} from '@/types'
import { generateId } from '@/lib/utils'
import { createEmptyProject, saveToLocalStorage, loadFromLocalStorage } from '@/lib/project-io'
import { DEMO_PROJECT } from '@/lib/demo-project'

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
  addStep: (planId: PlanId, step: Omit<PlanStep, 'id'>) => { ok: boolean; reason?: string }
  updateStep: (planId: PlanId, stepId: StepId, updates: Partial<Pick<PlanStep, 'notes'>>) => void
  deleteStep: (planId: PlanId, stepId: StepId) => void
  reorderSteps: (planId: PlanId, fromIndex: number, toIndex: number) => void

  // ── Release tracking ──────────────────────────────────────────────────────
  setReleaseStatus: (componentId: ComponentId, fromState: string, toState: string, status: ReleaseStatus) => void

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

    // ── Project-level ────────────────────────────────────────────────────────
    loadProject: (project) => {
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
      const usedInEdge = project.dependencies.some((e) => e.from === id || e.to === id)
      const usedInPlan = project.plans.some((p) => p.steps.some((s) => s.componentId === id))
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
        return { project, hasUnsavedChanges: true }
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
        return { project, hasUnsavedChanges: true }
      })
    },

    deleteStep: (planId, stepId) => {
      set((s) => {
        const plans = s.project.plans.map((p) =>
          p.id === planId ? { ...p, steps: p.steps.filter((st) => st.id !== stepId) } : p,
        )
        const project = { ...s.project, plans }
        saveToLocalStorage(project)
        return { project, hasUnsavedChanges: true, selectedStepId: null }
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
