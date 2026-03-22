## Context

The existing application models migrations as ordered sequences of **state transitions** — each step moves a single component from one state to another. The data model and feasibility engine both assume that the set of components is fixed throughout a migration plan: components are created upfront in the component registry and never created or destroyed as part of the plan itself.

This is insufficient for a common real-world pattern: **structural topology changes**, where two or more components are merged into one (or one component is split into many). For example, collapsing a separate `authorization-api` and `gateway` into a single `gateway` component that absorbs both responsibilities. In this scenario:

- `authorization-api` and the old `gateway` are **retired** partway through the migration.
- A new `gateway` component **comes into existence** at the point of merger.
- All dependency edges that previously pointed to the retired components must redirect to the new component.
- The feasibility engine must ensure no component depends on a retiring component past the step that retires it.

This change extends the data model, feasibility engine, and UI to first-class support of merge and split structural migration steps.

## Goals / Non-Goals

**Goals:**
- Introduce a `structural-merge` step type: N source components retire → 1 successor component is created
- Introduce a `structural-split` step type: 1 source component retires → N successor components are created
- Track component lifecycle status: `active` | `retiring` | `retired`
- Redirect dependency edges automatically when components retire and successors are introduced
- Extend feasibility analysis to detect dependencies on retiring or retired components
- Render structural steps visually (merge/split transitions) in the plan visualiser
- Render retiring/retired components distinctly in the dependency graph per migration step

**Non-Goals:**
- Partial merges (a component contributing some but not all of its responsibilities to a successor) — too complex for v1; model as a split + merge combination
- Automated discovery of which components should be merged — this is always user-authored
- History / undo of structural steps beyond the existing undo stack

## Decisions

### 1. Extend the migration step type to a discriminated union

**Decision:** The `Step` type becomes:

```ts
type Step =
  | { type: "state-transition"; componentId: string; fromState: string; toState: string; notes?: string }
  | { type: "structural-merge"; sourceIds: string[]; successorId: string; successorComponent: ComponentDefinition; notes?: string }
  | { type: "structural-split"; sourceId: string; successorIds: string[]; successorComponents: ComponentDefinition[]; notes?: string }
```

A structural step **defines** the successor components inline (or references pre-registered components), embedding the component creation inside the plan step rather than requiring them to pre-exist in the registry.

**Rationale:** Structural steps are inherently tied to a plan — the new component exists because of the migration, not before it. Embedding the successor definition in the step makes it self-describing. The discriminated union keeps the type model clean and exhaustive.

**Alternatives considered:**
- Separate "create component" and "retire component" step types: More granular but forces users to wire them together manually and makes merge semantics implicit rather than explicit.
- Pre-registering all successor components in the registry with a `status: planned` flag: Pollutes the registry with components that don't exist yet and complicates visualisation of the current (pre-migration) state.

---

### 2. Component status is derived, not authored

**Decision:** A component's `status` (`active` | `retiring` | `retired`) at any point in a plan is **computed** by simulating the plan up to that step — not stored as a field on the component in the registry. The registry only stores components that exist before the migration begins.

**Rationale:** Storing status as a mutable field creates consistency hazards (what does status mean across different plans?). Deriving it from plan simulation keeps the registry as a stable, plan-independent definition of the pre-migration world, and each plan independently determines component lifecycle.

**Alternatives considered:**
- Storing `status` on the component: Simpler to access but couples the component to a single plan and creates stale-state bugs.

---

### 3. Edge redirection is computed at simulation time

**Decision:** When a structural-merge step is simulated, the feasibility engine and graph renderer compute a **successor map**: `{ [retiredId]: successorId }`. All edges referencing a retired component are logically redirected to the successor for all subsequent steps in the simulation.

**Rationale:** This keeps the raw `dependencies[]` in the data model clean (no fan-out/redirect fields). The redirection is a simulation concern, not a storage concern.

**Alternatives considered:**
- Storing redirect rules on the dependency edges: Adds complexity to a data structure that should remain simple directed edges.

---

### 4. Feasibility: retirement constraint as a new constraint category

**Decision:** Add a `RetirementConstraint` checker to the feasibility simulation. Before applying each step, it verifies:
1. If a component being transitioned in this step is in `retiring` or `retired` status → violation.
2. If a structural step retires components that still have active dependents (post-redirect) → violation.

**Rationale:** These two checks cleanly cover the error cases introduced by structural steps without requiring changes to the existing state-transition constraint logic.

---

### 5. Visualiser: structural steps rendered as merge/split nodes on the timeline

**Decision:** In the plan timeline view, a `structural-merge` step is rendered as a **funnel node** (multiple incoming arrows from source component rows converging into the successor component row). A `structural-split` is rendered as a **fan-out node**. Retiring components' rows end at the structural step and are visually greyed/crossed out.

**Rationale:** Makes the topology change visually obvious in the timeline. Using a distinct node shape avoids ambiguity with regular state-transition steps.

---

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Existing plans that reference a now-retired component in a later step silently break | Feasibility checker surfaces this as a `RetirementConstraint` violation immediately; no silent corruption |
| JSON schema versioning: structural step type is a breaking change if old files lack the `type` field | Treat absence of `type` field as `"state-transition"` during load (backwards compatible default) |
| Timeline layout becomes complex when component rows appear/disappear mid-plan | Retiring rows terminate at the structural step; successor rows begin there — same horizontal axis, row count changes after the step |
| User confusion: where to define the successor component (inline vs registry) | For `structural-merge`/`split`, the successor is defined inline in the step wizard; it is automatically added to the registry as a read-only "migration-created" entry for reference in later steps |

## Open Questions

- Should a structural step be allowed in the middle of a plan, or only at defined "phase boundaries"? *(Propose: anywhere — no artificial restriction)*
- If a successor component is created by a structural step, can it later appear in another structural step (e.g., merged again)? *(Propose: yes, no restriction — the feasibility engine handles it)*
- Should the UI provide a "merge wizard" that auto-detects candidate components to merge based on shared dependency targets? *(Out of scope for v1 — future enhancement)*
