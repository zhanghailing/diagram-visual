## Why

The tool currently models component state transitions within a migration, but has no first-class support for structural topology changes — specifically, merging multiple existing components into a single new component (or splitting one into many). Without this, users cannot accurately model a common real-world pattern (e.g., collapsing an `authorization-api` and a `gateway` into a unified `gateway` component) and the dependency graph cannot reflect the topology before and after the merge.

## What Changes

- **Component merge operation**: Introduce a "merge" migration action that declares N source components being retired and 1 target component being created with the combined responsibilities.
- **Component split operation**: Introduce a "split" migration action (symmetric to merge) that declares 1 source component being retired and N target components being created.
- **Topology-aware dependency graph**: The dependency graph must update its edges when components are merged or split — edges pointing to retired components are redirected to their successor(s), and edges from retired components are re-sourced from their successor(s).
- **Retired component visualisation**: Components undergoing a merge/split are visualised in a distinct "retiring" state, making it clear they will cease to exist after the migration step completes.
- **Migration plan step type — structural change**: Migration plan steps can now be typed as `structural` (topology change) in addition to the existing `state-transition` type.
- **Feasibility analysis extended**: Feasibility checks account for components that no longer exist after a structural step — dependents of retired components must depend on successor components before the step that retires them.

## Capabilities

### New Capabilities

- `component-merge-split`: Define merge and split structural migration actions, linking source components to successor components with transferred responsibilities

### Modified Capabilities

- `component-registry`: Components need a `status` field (`active` | `retiring` | `retired`) and an optional `succeededBy` / `predecessors` linkage to support merge/split topology changes
- `dependency-graph`: Edge resolution must account for retiring components — edges must be redirectable to successor components; graph rendering must show topology changes across migration steps
- `migration-plan`: Migration plan steps must support a `structural` step type that encodes a merge or split action alongside the existing state-transition step type
- `feasibility-analysis`: Constraint checking must validate that no component depends on a retiring component past the step that retires it; successors must absorb all relevant dependencies before retirement
- `plan-visualizer`: Must render structural migration steps distinctly (e.g., animated merge/split transition between steps), showing the before and after topology side by side

## Impact

- **Component model**: The component data structure gains `status`, `succeededBy[]`, and `predecessors[]` fields.
- **Migration step model**: Step type becomes a discriminated union: `state-transition` | `structural-merge` | `structural-split`.
- **Dependency graph logic**: Edge traversal and rendering need to be topology-step-aware — the graph is not static across a migration plan.
- **Feasibility engine**: Retirement-aware validation is a new constraint category added to the existing feasibility checker.
- **UI**: New visual affordances needed: merge/split step editor, retiring component badges, and topology-diff view between steps.
