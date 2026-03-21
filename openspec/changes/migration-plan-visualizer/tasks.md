## 1. Project Bootstrap

- [x] 1.1 Scaffold Vite + React + TypeScript project with `npm create vite@latest`
- [x] 1.2 Install core dependencies: react-flow-renderer (or @xyflow/react), zustand, tailwindcss, shadcn/ui, @radix-ui/react-*, dagre
- [x] 1.3 Configure Tailwind and shadcn/ui with base theme
- [x] 1.4 Set up project directory structure: `src/types`, `src/store`, `src/components`, `src/views`, `src/lib`
- [x] 1.5 Define TypeScript types for the core data model: `Component`, `ComponentState`, `DependencyEdge`, `MigrationPlan`, `PlanStep`, `ReleaseEntry`, `Project`
- [x] 1.6 Implement JSON project file import/export (load from file, save to `.migplan.json`)
- [x] 1.7 Set up Zustand store with slices for project data, active plan, UI state

## 2. Component Registry

- [x] 2.1 Build `ComponentList` sidebar panel showing all components with type badges
- [x] 2.2 Build `ComponentForm` (create/edit) with name, type selector (frontend/backend/library/gateway/platform/other), and ordered state list editor
- [x] 2.3 Add validation: require ≥2 states, unique names, block creation on duplicate
- [x] 2.4 Implement state reordering within `ComponentForm` (drag-and-drop or up/down buttons)
- [x] 2.5 Implement component deletion with referential integrity check (block if referenced in plans or edges)
- [x] 2.6 Wire all component CRUD actions to Zustand store

## 3. Dependency Graph

- [x] 3.1 Set up React Flow canvas for the dependency graph view
- [x] 3.2 Implement custom `ComponentNode` (shows component name, type, states list)
- [x] 3.3 Implement custom `DependencyEdge` with label showing `fromState → toState`
- [x] 3.4 Build `AddEdgePanel` form for selecting source component, source state, target component, target state
- [x] 3.5 Add validation: prevent self-referential edges, duplicate edges, and cycle detection (DFS)
- [x] 3.6 Implement edge deletion (select edge + delete action)
- [x] 3.7 Apply Dagre auto-layout with manual node repositioning support
- [x] 3.8 Wire dependency graph state to Zustand store

## 4. Migration Plan Authoring

- [x] 4.1 Build `PlanList` panel showing all plans with feasibility status badge
- [x] 4.2 Build `CreatePlanModal` with name validation (unique names)
- [x] 4.3 Build `PlanStepEditor` for adding steps: select component, fromState, toState, optional notes
- [x] 4.4 Add step validation: fromState ≠ toState
- [x] 4.5 Implement step reordering in the plan editor (drag-and-drop)
- [x] 4.6 Implement step deletion
- [x] 4.7 Implement plan duplication ("copy" creates new plan with all steps cloned)
- [x] 4.8 Implement plan deletion with confirmation dialog
- [x] 4.9 Wire all plan CRUD actions to Zustand store

## 5. Feasibility Analysis Engine

- [x] 5.1 Implement `simulatePlan(plan, dependencies)` function: forward-simulate steps, track current state per component, check dependency preconditions at each step
- [x] 5.2 Return per-step result: `{ status: "ok" | "violation" | "unvalidated", reason?: string }`
- [x] 5.3 Implement cycle detection utility used by both dependency graph and feasibility engine
- [x] 5.4 Memoize feasibility results per plan (recompute on plan or dependency changes)
- [x] 5.5 Write unit tests for the simulation engine covering: valid plan, single violation, cascade unvalidated, edge cases (empty plan, no dependencies)

## 6. Plan Timeline Visualiser

- [x] 6.1 Build `PlanTimeline` component: rows = components, columns = steps, cells show effective state
- [x] 6.2 Highlight transition cells (fromState → toState) with a distinct visual treatment
- [x] 6.3 Apply feasibility colour-coding: green/neutral for OK, red for violation, grey/muted for unvalidated
- [x] 6.4 Build `StepDetailPanel` (side panel or popover): shows component, fromState, toState, notes, feasibility status, violation reason
- [x] 6.5 Implement component row filter (multi-select to hide/show component rows)
- [x] 6.6 Build combined dependency graph + timeline split-view layout

## 7. Release Tracker

- [x] 7.1 Build `ReleaseStatusPanel` listing components and their transitions with status controls (untracked / implemented / released)
- [x] 7.2 Implement transition status toggle (untracked → implemented → released; allow rollback)
- [x] 7.3 Show release status indicators (icons/colours) on timeline transition cells
- [x] 7.4 Build `LiveStateView` panel: derive each component's current live state from all "released" transitions and display as a component state summary
- [x] 7.5 Wire release tracking state to Zustand store with persistence in project JSON

## 8. Plan Comparison

- [x] 8.1 Build `PlanComparisonSelector` allowing selection of 2–4 plans to compare
- [x] 8.2 Build `SideBySideTimeline` rendering parallel timelines with shared component rows
- [x] 8.3 Implement difference highlighting: detect cells with differing state or absent steps between plans
- [x] 8.4 Show per-plan feasibility status in comparison header row
- [x] 8.5 Build `OverlayTimeline` mode: merged single timeline with diff annotations (both plan values shown on differing cells)
- [x] 8.6 Implement mode toggle (side-by-side ↔ overlay)

## 9. State Diff Viewer

- [x] 9.1 Build `StateDiffPanel` two-panel component: before state (left) and after state (right) for a selected transition
- [x] 9.2 Display in each panel: state name, relevant dependency edges for that state, release status
- [x] 9.3 Highlight added dependency constraints (green) and removed constraints (red) between before and after states
- [x] 9.4 Implement cross-plan diff mode: compare a component's effective state at a given step index across two plans
- [x] 9.5 Wire diff panel to open from timeline cell right-click / action button

## 10. Navigation and Layout

- [x] 10.1 Build application shell: top nav, sidebar (component list + plan list), main content area
- [x] 10.2 Implement view routing/switching: Dependency Graph, Plan Timeline, Plan Comparison, Release Tracker, Live State
- [x] 10.3 Add project-level import/export buttons in the nav bar with file picker
- [x] 10.4 Add "New Project" action that clears the store after a confirmation prompt
- [x] 10.5 Implement auto-save to localStorage (debounced, on every state change)
- [x] 10.6 Show unsaved indicator if in-memory state differs from last exported file

## 11. Polish and Quality

- [x] 11.1 Add empty-state illustrations/messages for: no components, no plans, no dependency edges
- [x] 11.2 Add keyboard shortcuts: delete selected node/edge, open add-component panel, open add-step panel
- [x] 11.3 Ensure all interactive elements are accessible (keyboard navigable, ARIA labels)
- [x] 11.4 Add a sample/demo project that loads on first visit to illustrate the tool's capabilities
- [x] 11.5 Configure Vite build for static deployment (base URL, output dir)
- [x] 11.6 Write integration smoke tests: create project, add components, add edges, create plan, run feasibility check, export/import round-trip
