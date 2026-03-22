## Context

This is a greenfield browser-based web application for modelling and visualising multi-component migration plans. There is no existing codebase. The primary users are engineers and architects who need to reason about the ordering, feasibility, and trade-offs of migrating interconnected systems (frontend apps, backends, shared libraries, gateways, platform layers, etc.).

The core problem: when many components each have multiple states (e.g., a backend supporting both v1 and v2 APIs, or a library at two major versions), the valid orderings of migration steps are constrained by inter-component dependencies. Errors in ordering (e.g., deploying a frontend that requires a new API before the backend ships it) cause outages or broken states. Users need a tool to model these constraints and automatically detect invalid plans.

## Goals / Non-Goals

**Goals:**
- Model components with typed roles and multi-state lifecycles (each state represents a point in the migration)
- Model directed, state-level dependency edges: "component A must be in state X before component B can transition to state Y"
- Author one or more migration plans (ordered sequences of component state transitions)
- Automatically validate plans for dependency violations and surface reasons
- Visually render plans as timelines / step-by-step graphs
- Mark individual component changes as "implemented" or "released" and reflect this in the live view
- Compare two migration plans side-by-side or overlaid
- View before/after diffs of component states
- All logic runs client-side; data is persisted via import/export of a JSON project file
- Deployable as a static site (no backend)

**Non-Goals:**
- Real-time multi-user collaboration (out of scope for v1)
- Integration with CI/CD systems or deployment pipelines (future)
- Automated migration execution (this is a planning/visualisation tool only)
- Backend persistence or user authentication

## Decisions

### 1. React SPA with no backend

**Decision:** Client-only React application, state persisted to JSON (download/upload).

**Rationale:** The tool is a planning aid, not an operational system. All computation (graph traversal, feasibility analysis) is cheap enough to run in-browser. A static deployment lowers operational overhead. File-based persistence is portable and reviewable in version control.

**Alternatives considered:**
- Backend with a database: Adds deployment complexity and is unnecessary for v1 since collaboration is out of scope.
- localStorage only: Too limiting for large projects and not portable across machines.

---

### 2. React Flow as the primary graph/diagram library

**Decision:** Use [React Flow](https://reactflow.dev/) for rendering interactive directed graphs of components and dependencies.

**Rationale:** React Flow is purpose-built for node-edge diagrams in React, has excellent support for custom nodes/edges, built-in pan/zoom, and an active community. It is far less low-level than D3 while still being fully customisable.

**Alternatives considered:**
- D3.js: Maximum flexibility but high implementation cost, non-idiomatic with React.
- Mermaid/Graphviz: Good for static diagrams but not interactive enough for this use case.
- Cytoscape.js: Powerful but heavier and less React-native.

---

### 3. Zustand for state management

**Decision:** Use Zustand for client-side application state (project data, active plan, UI state).

**Rationale:** Zustand is lightweight, has no boilerplate, and integrates naturally with React. The data model (components, plans, release status) fits well into a flat Zustand store with derived selectors.

**Alternatives considered:**
- Redux Toolkit: More powerful but heavyweight for a client-only app of this scale.
- React context + useReducer: Sufficient but becomes verbose as state complexity grows.

---

### 4. Data model: Project as a graph of components with state machines

**Decision:** Core data model is a `Project` object containing:
- `components[]`: Each component has an `id`, `type` (frontend | backend | library | gateway | platform | other), `states[]` (ordered list of named states), and optional metadata.
- `dependencies[]`: Each dependency is a directed edge `{ from: ComponentId, fromState: StateId, to: ComponentId, toState: StateId }` meaning "component `to` can only enter state `toState` if component `from` is already in state `fromState`".
- `plans[]`: Each plan is an ordered list of `steps`, where each step is `{ componentId, fromState, toState, notes }`.
- `releases[]`: A set of `{ componentId, state, status: "implemented" | "released" }` entries.

**Rationale:** This model is minimal but expressive. State-level dependency edges capture both simple ("backend must be at v2 before frontend can use v2") and compound constraints. Plans as ordered step sequences make timeline rendering straightforward.

---

### 5. Feasibility analysis via topological ordering and constraint checking

**Decision:** For each plan, compute feasibility by simulating the plan step-by-step, tracking each component's current state. Before applying each step, check that all dependency preconditions for that transition are satisfied by the current simulated state. Flag violations with human-readable reasons.

**Rationale:** This is a simple forward simulation — no SAT solver or complex constraint propagation needed. The plan is user-authored so we validate it, not search for a valid plan.

**Alternatives considered:**
- Full constraint satisfaction / search: Would enable "suggest a valid ordering" but is complex and out of scope for v1.

---

### 6. Vite + TypeScript + shadcn/ui

**Decision:** Use Vite as the build tool, TypeScript throughout, and shadcn/ui (built on Radix UI + Tailwind) for UI components.

**Rationale:** Vite offers fast DX. TypeScript prevents runtime errors in the graph/constraint logic. shadcn/ui provides accessible, composable primitives without a heavy design system lock-in.

---

### 7. Plan comparison as parallel timeline views

**Decision:** Plan comparison renders two (or more) plans in parallel horizontal timelines, with shared component rows, so differences in step ordering and states are visually obvious. Colour coding highlights steps that differ between plans.

**Rationale:** Parallel timelines with shared axes are the most intuitive way to spot ordering differences. Overlay (merged single view) is a secondary mode for quickly seeing divergence points.

---

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| React Flow layout for large component graphs becomes cluttered | Provide auto-layout via Dagre (bundled with React Flow ecosystem); allow manual node positioning |
| JSON file format churn if data model evolves | Version the JSON schema (`"version": 1`); write a migration function for future breaking changes |
| Feasibility simulation is O(steps × dependencies) — slow for very large plans | Acceptable for v1 scope (tens of components, hundreds of steps); add memoisation if perf becomes an issue |
| Editing UX complexity (adding components, wiring dependencies, authoring plans) | Focus on a clean sidebar form-driven editor before attempting drag-to-connect interactions |
| Browser storage limits if project JSON is large | File-based import/export sidesteps this; localStorage is only used for auto-save of small projects |

## Open Questions

- Should steps in a plan be grouped into "phases" (e.g., "Phase 1: backend rollout") or remain flat? *(Propose flat with optional labels for v1)*
- Should the tool support "parallel steps" (multiple component transitions that can happen in any order within a phase), or only strict sequential ordering? *(Strict sequential for v1; parallel phases as a v2 enhancement)*
- What is the canonical file extension for project files? Suggest `.migplan.json`.
