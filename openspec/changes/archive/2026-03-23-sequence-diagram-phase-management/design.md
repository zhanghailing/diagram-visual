## Context

Architecture and C4 diagrams support full phase lifecycle management via `addDiagramPhase`, `renameDiagramPhase`, and `deleteDiagramPhase` store actions, surfaced through `PhaseEditorPopover` in `DiagramCanvasView`. Sequence diagrams share the same `phaseOrder` data structure (`DiagramPhase[]` on the `Diagram` type) but `SequenceDiagramView` never wires up `PhaseEditorPopover` — it only renders `PhaseSwitcher` for switching between phases.

The store already handles sequence-diagram data cleanup in `deleteDiagramPhase` (it strips orphaned `sequencePhases` entries). The missing pieces are purely in the view layer.

## Goals / Non-Goals

**Goals:**
- Add phase management controls (add, rename, delete) to the sequence diagram toolbar by reusing `PhaseEditorPopover`
- Add store action `reorderSequenceDiagramPhases` and expose reordering in `PhaseEditorPopover`
- Keep the same UX patterns as architecture/C4 diagrams (gear icon → popover, locked base phase, rename-on-blur, delete button)

**Non-Goals:**
- Modifying participant/message content overrides per phase (renaming a participant in one phase)
- Changing the underlying `SequencePhaseState` data model
- Adding drag-and-drop reorder — up/down arrow buttons in the popover is sufficient

## Decisions

### Decision 1: Reuse `PhaseEditorPopover` rather than build a new component

`PhaseEditorPopover` already accepts `diagramId` and `phases` props and calls generic store actions (`addDiagramPhase`, `renameDiagramPhase`, `deleteDiagramPhase`) that work on `phaseOrder` — the same field used by sequence diagrams. Adding it to `SequenceDiagramView` requires one import and one JSX line.

**Alternative considered:** Build a separate `SequencePhaseEditorPopover`. Rejected — unnecessary duplication.

### Decision 2: Add reorder support to `PhaseEditorPopover` via up/down buttons

`PhaseEditorPopover` doesn't currently support reordering. Adding up/down arrow icon buttons next to each non-base phase (disabled at boundaries) is the simplest addition that is consistent with the existing popover style. A new store action `reorderDiagramPhases(diagramId, fromIdx, toIdx)` moves a phase in `phaseOrder`.

**Alternative considered:** Drag-and-drop within the popover. Requires a DnD library integration; deferred as follow-up.

### Decision 3: `reorderDiagramPhases` is generic (not sequence-specific)

The reorder action works on `phaseOrder` which is shared across all diagram types. Making it generic means architecture/C4 diagrams also gain reorder support for free.

## Risks / Trade-offs

- [Risk] Deleting a phase that has participants/messages added to it loses that data → Mitigation: existing `deleteDiagramPhase` already cleans up `sequencePhases[phaseId]`; no extra handling needed.
- [Risk] Reordering phases changes the cumulative inheritance order, potentially hiding previously visible participants → Mitigation: this is expected and correct behavior; document in UI tooltip.
- [Trade-off] Up/down buttons are less ergonomic than drag-and-drop for many phases, but simpler to implement and avoids new dependencies.
