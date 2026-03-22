## Context

The diagram authoring tool currently hardcodes phases as a TypeScript union `'as-is' | 'phase-1' | 'phase-2'` and a constant array `PHASE_ORDER` in `diagram-phase.ts`. The `PhaseSwitcher` renders these three tabs unconditionally. The store keys phase override data (`PhaseState`, `SequencePhaseState`) in `Record<PhaseId, ...>` maps using these fixed IDs.

The change touches four layers: the type system, the data model, the resolution/diff logic, and the UI.

## Goals / Non-Goals

**Goals:**
- Replace `PhaseId` fixed union with `string` (opaque, stable, UUID-like)
- Add `phaseOrder: DiagramPhase[]` to `Diagram` (ordered list of `{ id, label }`)
- Auto-migrate existing `Diagram` objects that have no `phaseOrder` by generating the default 3-phase list
- `PhaseSwitcher` reads phases from the diagram prop
- Provide `addDiagramPhase`, `renameDiagramPhase`, `deleteDiagramPhase` store actions
- `PhaseEditorPopover` component: inline popover on the canvas toolbar for managing phases
- Resolution and diff logic uses `diagram.phaseOrder` instead of the hardcoded constant
- First phase in `phaseOrder` is always the base ("as-is" equivalent); it cannot be deleted

**Non-Goals:**
- Reordering phases (only append/delete; order is creation order)
- Per-diagram phase templates or defaults
- Cross-diagram phase sharing

## Decisions

### 1. `PhaseId` becomes `string`, not a new enum
The simplest option. Phase IDs are generated with `generateId()` at creation time so they are stable across renames. Renaming only changes the `label`; the `id` is never mutated.

**Alternatives:** Slug-derived IDs (e.g., `my-phase-1`) — rejected because renames would invalidate override keys.

### 2. Store `phaseOrder` on `Diagram`, not globally
Each diagram has its own phase progression (e.g., one diagram might model a 2-step migration; another a 5-step one). Storing it per-diagram avoids coupling between diagrams.

### 3. Auto-migration for existing diagrams
When `diagram.phaseOrder` is missing (old data), the resolution logic and UI generate a default `phaseOrder` of `[{id: 'as-is', label: 'As-Is'}, {id: 'phase-1', label: 'Phase 1'}, {id: 'phase-2', label: 'Phase 2'}]`. This preserves all existing override data keyed by the old IDs without any data transformation.

### 4. `PhaseEditorPopover` as a toolbar button
A gear/settings icon next to the `PhaseSwitcher` opens a small popover listing phases with rename inputs and delete buttons, plus an "Add Phase" button at the bottom. This keeps the canvas toolbar clean.

### 5. Base phase is protected
The first phase in `phaseOrder` cannot be deleted or have its order changed. All nodes/edges defined in the base phase are shared as the inheritance root. A visual lock indicator in the popover communicates this.

## Risks / Trade-offs

- **Breaking change to `PhaseId` type** → Mitigation: `PhaseId` becomes `string`, so all existing uses remain valid; the TypeScript compiler will catch any remaining union-specific comparisons (none exist in current code)
- **Stale `activePhase` state** → If a user deletes the currently active phase, the component must fall back to the first phase. The `DiagramCanvasView` and `SequenceDiagramView` already hold `activePhase` in local state; they need a `useEffect` to reset when the phase is deleted.
- **Missing `phaseOrder` on old diagrams loaded from localStorage** → Mitigated by `getPhaseOrder(diagram)` helper that returns a default list when `phaseOrder` is absent.

## Migration Plan

No server-side migration needed. Client-side:
1. `getPhaseOrder(diagram)` helper returns `diagram.phaseOrder ?? DEFAULT_PHASE_ORDER`
2. `addDiagramPhase` initializes `phaseOrder` to the default if it doesn't exist before appending
3. Existing localStorage data continues to work — old phase IDs (`'as-is'`, `'phase-1'`, `'phase-2'`) match the default `phaseOrder` IDs
