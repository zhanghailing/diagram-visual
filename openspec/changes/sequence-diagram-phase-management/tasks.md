## 1. Store — Add reorder action

- [x] 1.1 Add `reorderDiagramPhases(diagramId, fromIdx, toIdx)` action to `src/store/index.ts` that moves a phase in `phaseOrder` (guards: no-op if `fromIdx === 0` or result would place phase at index 0)
- [x] 1.2 Expose `reorderDiagramPhases` in the store type interface

## 2. PhaseEditorPopover — Add reorder controls

- [x] 2.1 Add up/down arrow buttons (`ChevronUp` / `ChevronDown`) next to each non-base phase row in `src/components/PhaseEditorPopover.tsx`
- [x] 2.2 Wire up/down buttons to call `reorderDiagramPhases`; disable "up" at index 1 and disable "down" at last index

## 3. SequenceDiagramView — Wire phase editor into toolbar

- [x] 3.1 Import `PhaseEditorPopover` in `src/views/SequenceDiagramView.tsx`
- [x] 3.2 Add `<PhaseEditorPopover diagramId={diagram.id} phases={getPhaseOrder(liveDiagram)} />` to the sequence diagram toolbar, adjacent to the `PhaseSwitcher`
- [x] 3.3 Ensure `activePhase` resets to `'as-is'` when the currently active phase is deleted (listen to phase list changes)

## 4. Verification

- [ ] 4.1 Manually verify: add a phase in sequence diagram → appears in switcher
- [ ] 4.2 Manually verify: rename a phase → label updates in switcher
- [ ] 4.3 Manually verify: delete a phase → removed from switcher, data cleared
- [ ] 4.4 Manually verify: reorder phases → order reflected in switcher and cumulative resolution
- [x] 4.5 Run existing tests (`npm test`) and confirm no regressions
