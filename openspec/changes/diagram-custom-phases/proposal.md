## Why

The current diagram authoring tool hardcodes exactly three phases (`as-is`, `phase-1`, `phase-2`), but real migration projects vary in scope — some need one transition, others need five or more. Users need to define their own phase set with meaningful names so the tool fits their actual project structure.

## What Changes

- **BREAKING**: Phase IDs change from a fixed union (`'as-is' | 'phase-1' | 'phase-2'`) to a dynamic string type per diagram, with an ordered array of phase definitions stored on each diagram
- Each diagram stores a `phases` array of `{ id, label }` objects; the first phase acts as the base (equivalent to the old `as-is`)
- The `PhaseSwitcher` component renders tabs dynamically from the diagram's phase list instead of from a hardcoded constant
- Users can add new phases (append to end), rename any phase, and delete non-base phases (base phase is protected)
- Phase data (overrides, added nodes/edges) continues to be keyed by phase ID; IDs are stable strings generated at creation time
- `diagram-phase.ts` resolution logic generalises to walk an arbitrary ordered phase list instead of a fixed 3-item array
- The `PhaseDiffView` from/to selectors populate from the diagram's actual phase list

## Capabilities

### New Capabilities
- `phase-editor`: UI for adding, renaming, and deleting phases on a diagram — accessible from the canvas toolbar

### Modified Capabilities
- `phase-management`: Phase set is now dynamic per diagram; `PhaseId` becomes a generic `string`; resolution and diff logic walks the diagram's `phases` array; `PhaseSwitcher` renders from the diagram's phase list

## Impact

- `src/types/index.ts`: `PhaseId` becomes `string`; `Diagram` gains a `phaseOrder: DiagramPhase[]` field
- `src/lib/diagram-phase.ts`: replace hardcoded `PHASE_ORDER` constant with per-diagram `phaseOrder`
- `src/components/PhaseSwitcher.tsx`: read phases from diagram prop instead of constant
- `src/store/index.ts`: add `addDiagramPhase`, `renameDiagramPhase`, `deleteDiagramPhase` actions; migrate existing diagrams to include `phaseOrder`
- `src/components/PhaseDiffView.tsx`: use diagram's phase list for selectors
- All call sites that pass `PhaseId` literals (`'as-is'`, `'phase-1'`, `'phase-2'`) must be updated to use the diagram's first/other phase IDs
