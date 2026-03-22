## 1. Type System

- [ ] 1.1 Change `PhaseId` in `src/types/index.ts` from a fixed union to `string`
- [ ] 1.2 Add `DiagramPhase` interface (`{ id: string; label: string }`) to `src/types/index.ts`
- [ ] 1.3 Add `phaseOrder?: DiagramPhase[]` field to the `Diagram` interface in `src/types/index.ts`

## 2. Phase Resolution Helper

- [ ] 2.1 Add `getPhaseOrder(diagram: Diagram): DiagramPhase[]` helper to `src/lib/diagram-phase.ts` that returns `diagram.phaseOrder` if present, else the default 3-phase list `[{id:'as-is',label:'As-Is'},{id:'phase-1',label:'Phase 1'},{id:'phase-2',label:'Phase 2'}]`
- [ ] 2.2 Replace the hardcoded `PHASE_ORDER` constant in `src/lib/diagram-phase.ts` with a call to `getPhaseOrder(diagram)` in `resolveDiagramPhase` and `diffPhases`
- [ ] 2.3 Update `resolveDiagramPhase` signature to accept `diagram: Diagram` (already does) and use `getPhaseOrder` for phase walk order
- [ ] 2.4 Update `diffPhases` to use `getPhaseOrder` for building the from/to resolved views

## 3. Store Actions

- [ ] 3.1 Add `addDiagramPhase(diagramId: DiagramId, label: string) => void` action to the store — appends a new `DiagramPhase` with a generated ID to `diagram.phaseOrder` (initialising it from default if absent)
- [ ] 3.2 Add `renameDiagramPhase(diagramId: DiagramId, phaseId: string, label: string) => void` action — updates the matching `DiagramPhase.label` in `phaseOrder`
- [ ] 3.3 Add `deleteDiagramPhase(diagramId: DiagramId, phaseId: string) => void` action — removes the phase from `phaseOrder` (no-op if it is the first phase) and removes its entry from `diagram.phases` / `diagram.sequencePhases`

## 4. PhaseSwitcher Component

- [ ] 4.1 Update `PhaseSwitcher` to accept a `phases: DiagramPhase[]` prop instead of rendering from a hardcoded constant
- [ ] 4.2 Remove the internal `PHASES` constant from `PhaseSwitcher.tsx`
- [ ] 4.3 Update all call sites of `PhaseSwitcher` (`DiagramCanvasView`, `SequenceDiagramView`) to pass `getPhaseOrder(diagram)` as the `phases` prop

## 5. PhaseEditorPopover Component

- [ ] 5.1 Create `src/components/PhaseEditorPopover.tsx` with a popover triggered by a settings icon button
- [ ] 5.2 List phases in order; first phase shows a lock icon and no delete button
- [ ] 5.3 Each non-base phase has: an inline label input (rename on change), and a delete icon button
- [ ] 5.4 "Add Phase" button at the bottom calls `addDiagramPhase` with a default label
- [ ] 5.5 After adding a phase, focus the new phase's label input

## 6. Canvas & Sequence View Integration

- [ ] 6.1 Add `PhaseEditorPopover` to `DiagramCanvasView` toolbar, adjacent to `PhaseSwitcher`
- [ ] 6.2 Add `PhaseEditorPopover` to `SequenceDiagramView` toolbar
- [ ] 6.3 In `DiagramCanvasView`, add a `useEffect` that resets `activePhase` to the first phase when the active phase ID is no longer in the diagram's phase list (handles deletion of active phase)
- [ ] 6.4 In `SequenceDiagramView`, add the same active-phase-reset `useEffect`

## 7. PhaseDiffView Update

- [ ] 7.1 Pass `phases: DiagramPhase[]` prop to `PhaseDiffView` and replace hardcoded `PHASES` constant with the prop
- [ ] 7.2 Update `DiagramListView` to pass `getPhaseOrder(activeDiagram)` to `PhaseDiffView`
- [ ] 7.3 Update default `fromPhase` and `toPhase` state in `PhaseDiffView` to use first and second phase IDs from the prop

## 8. Tests

- [ ] 8.1 Unit test `getPhaseOrder`: returns `phaseOrder` when present; returns default 3-phase list when absent
- [ ] 8.2 Unit test `resolveDiagramPhase` with a 4-phase diagram to verify inheritance walks all phases
- [ ] 8.3 Unit test `deleteDiagramPhase` store action: phase removed from list; override data cleaned up; no-op on first phase
- [ ] 8.4 Unit test active-phase fallback: if `activePhase` is not in `getPhaseOrder(diagram)`, component falls back to first phase
