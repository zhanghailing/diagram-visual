## Why

Sequence diagram phases currently cannot be renamed, reordered, or added/deleted — unlike architecture and C4 diagram phases which support full lifecycle management. This makes sequence diagrams a second-class citizen and limits users who want to present incremental system evolution across multiple phases.

## What Changes

- Add **Add Phase** button to sequence diagram toolbar (same as architecture/C4 toolbar)
- Add **Phase Editor Popover** to sequence diagram toolbar enabling rename and delete of phases
- Add **Reorder phases** capability — drag-to-reorder or up/down controls for sequence diagram phases
- Add store actions: `addSequenceDiagramPhase`, `renameSequenceDiagramPhase`, `deleteSequenceDiagramPhase`, `reorderSequenceDiagramPhases`
- Reuse `PhaseEditorPopover` component in `SequenceDiagramView` (currently only used in `DiagramCanvasView`)

## Capabilities

### New Capabilities

- `sequence-phase-management`: Add, rename, delete, and reorder phases in sequence diagrams, bringing parity with architecture/C4 diagram phase management

### Modified Capabilities

<!-- None — no existing spec files exist in openspec/specs/ -->

## Impact

- `src/views/SequenceDiagramView.tsx` — add phase management toolbar controls
- `src/store/index.ts` — add `addSequenceDiagramPhase`, `renameSequenceDiagramPhase`, `deleteSequenceDiagramPhase`, `reorderSequenceDiagramPhases` actions
- `src/components/PhaseEditorPopover.tsx` — verify it works generically (may need minor props update)
- `src/types/index.ts` — verify `DiagramPhase` / `phaseOrder` structures support sequence diagrams
