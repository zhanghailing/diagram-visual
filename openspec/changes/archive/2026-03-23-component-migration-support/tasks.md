## 1. Data Model — Extend Step Type

- [x] 1.1 Define `StructuralMergeStep` type: `{ type: "structural-merge"; sourceIds: string[]; successorId: string; successorComponent: ComponentDefinition; notes?: string }`
- [x] 1.2 Define `StructuralSplitStep` type: `{ type: "structural-split"; sourceId: string; successorIds: string[]; successorComponents: ComponentDefinition[]; notes?: string }`
- [x] 1.3 Update `Step` type to a discriminated union: `StateTransitionStep | StructuralMergeStep | StructuralSplitStep`
- [x] 1.4 Add `type: "state-transition"` discriminant to existing `StateTransitionStep` (with backwards-compatible default for JSON files that lack the field)
- [x] 1.5 Update project JSON schema version and write a load-time migration that defaults missing `type` to `"state-transition"`

## 2. Data Model — Component Registry Extensions

- [x] 2.1 Add `migrationCreated?: { planId: string; stepIndex: number }` field to `ComponentDefinition`
- [x] 2.2 Update project persistence (export/import) to serialise and restore the new `migrationCreated` field and the discriminated step union
- [x] 2.3 Write unit tests for project file round-trip with structural steps

## 3. Plan Simulation — Lifecycle Tracking

- [x] 3.1 Create a `simulatePlanUpTo(plan, stepIndex)` function that returns the set of `active`, `retiring`, and `retired` component IDs at each step
- [x] 3.2 On encountering a `structural-merge` step: mark source components `retiring` (at the step) then `retired` (after), add successor to `active`
- [x] 3.3 On encountering a `structural-split` step: mark source component `retiring` then `retired`, add all successors to `active`
- [x] 3.4 Build the successor map `{ [retiredId]: successorId | successorId[] }` during simulation for use by edge redirection
- [x] 3.5 Write unit tests for `simulatePlanUpTo` covering merge, split, and chained structural steps

## 4. Feasibility Engine — Retirement Constraints

- [x] 4.1 Add `RetirementConstraintChecker`: before each state-transition step, verify the target component is not `retired` at that point; flag violation if so
- [x] 4.2 Add structural step pre-check: verify no active dependents of retiring components remain unresolved (i.e., no post-step edge still targets a retiring component without a corresponding redirect)
- [x] 4.3 Apply edge redirection in the simulation: after a structural step, remap all edges referencing retired components to their successor(s) for subsequent constraint checks
- [x] 4.4 Extend violation reason messages for retirement violations: `"Component [X] has been retired at step [M] and cannot be transitioned"` and `"Component [B] still depends on [A] which is being retired"`
- [x] 4.5 Write unit tests for retirement constraint detection (post-retirement transition, unresolved dependent, valid merge with no dependents)

## 5. Component Registry UI

- [x] 5.1 Display a `migration-created` badge on registry entries that have `migrationCreated` set, with a link to the originating plan and step
- [x] 5.2 Make `migration-created` component fields read-only in the registry edit form; show a redirect message pointing to the owning structural step
- [x] 5.3 Block deletion of `migration-created` components in the delete confirmation flow with an explanatory error message

## 6. Plan Editor — Structural Step Authoring

- [x] 6.1 Add "Add Structural Step" option to the plan step addition UI (alongside existing "Add State Transition")
- [x] 6.2 Build `StructuralMergeStepForm`: multi-select for source components (filtered to `active` components at insertion position), inline `ComponentDefinition` form for the successor
- [x] 6.3 Build `StructuralSplitStepForm`: single-select for source component, list of inline `ComponentDefinition` forms for successors (minimum 2)
- [x] 6.4 Validate merge: at least 2 sources selected, successor name unique
- [x] 6.5 Validate split: exactly 1 source selected, at least 2 successors defined, all successor names unique
- [x] 6.6 Filter component selector for state-transition steps at position N to exclude components that are `retired` at position N
- [x] 6.7 On save of a structural step, auto-register successor components in the registry as `migration-created`
- [x] 6.8 On delete of a structural step, remove its `migration-created` successor components from the registry (if not referenced elsewhere)

## 7. Plan Timeline Visualiser

- [x] 7.1 Update timeline column renderer to handle the `structural-merge` and `structural-split` step types with a distinct column style (funnel / fan-out icon, different background)
- [x] 7.2 Terminate retiring component rows at the structural step column with a visual end-cap (strikethrough or fade-out); suppress cells for that row in later columns
- [x] 7.3 Begin successor component rows at the structural step column and extend them through subsequent columns
- [x] 7.4 Build `StructuralStepDetailPanel`: shows step type, source component names, successor component name(s), notes, and any violation reason
- [x] 7.5 Wire click on a structural step column to open `StructuralStepDetailPanel`
- [x] 7.6 Apply feasibility colour-coding to structural step columns (red for retirement constraint violations, normal for valid steps)

## 8. Dependency Graph — Topology-Aware Rendering

- [x] 8.1 Update the dependency graph to accept a `stepIndex` prop (driven by the selected plan step in the timeline)
- [x] 8.2 Use `simulatePlanUpTo(plan, stepIndex)` to compute the active/retired set and successor map at the selected step
- [x] 8.3 Render retired component nodes in a greyed-out / crossed-out style when `stepIndex` is at or after their retirement step
- [x] 8.4 Add successor component nodes to the graph when `stepIndex` is at or after their introduction step
- [x] 8.5 Render redirected edges (edges that previously targeted retired components) as terminating at the successor, with a dashed line or annotation indicating redirection
- [x] 8.6 Animate the topology transition (source nodes converging / fanning out) when the selected step crosses a structural step boundary

## 9. Integration & Regression Tests

- [x] 9.1 End-to-end test: author a plan with a merge step, verify timeline renders correctly, verify feasibility analysis catches a post-retirement transition violation
- [x] 9.2 End-to-end test: author a plan with a split step, verify successor rows appear in timeline, verify registry shows `migration-created` entries
- [x] 9.3 Regression test: existing plans without structural steps continue to load, render, and validate correctly (backwards compatibility)
- [x] 9.4 Export/import round-trip test: project with structural steps exports and reimports with all data intact
