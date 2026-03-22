## 1. Type System

- [x] 1.1 Change `PhaseId` in `src/types/index.ts` from `'as-is' | 'phase-1' | 'phase-2'` to `string`
- [x] 1.2 Add `DiagramPhase` interface (`{ id: string; label: string }`) to `src/types/index.ts`
- [x] 1.3 Add `phaseOrder?: DiagramPhase[]` field to the `Diagram` interface in `src/types/index.ts`

## 2. Phase Resolution Helper

- [x] 2.1 Add `getPhaseOrder(diagram: Diagram): DiagramPhase[]` helper to `src/lib/diagram-phase.ts` — returns `diagram.phaseOrder` if present, else the default 3-phase list `[{id:'as-is',label:'As-Is'},{id:'phase-1',label:'Phase 1'},{id:'phase-2',label:'Phase 2'}]`
- [x] 2.2 Replace the hardcoded `PHASE_ORDER` constant in `src/lib/diagram-phase.ts` with calls to `getPhaseOrder(diagram)` in `resolveDiagramPhase` and `diffPhases`
- [x] 2.3 Update `resolveDiagramPhase` to use `getPhaseOrder` for the phase walk order
- [x] 2.4 Update `diffPhases` to use `getPhaseOrder` for building from/to resolved views

## 3. Store Actions

- [x] 3.1 Add `addDiagramPhase(diagramId: DiagramId, label: string): void` action — appends a new `DiagramPhase` with a `generateId()` ID to `diagram.phaseOrder` (initialising from default fallback if absent)
- [x] 3.2 Add `renameDiagramPhase(diagramId: DiagramId, phaseId: string, label: string): void` action — updates the matching `DiagramPhase.label` in `phaseOrder`
- [x] 3.3 Add `deleteDiagramPhase(diagramId: DiagramId, phaseId: string): void` action — removes the phase from `phaseOrder` (no-op if it is the first phase) and removes its entry from `diagram.phases` and `diagram.sequencePhases`
- [x] 3.4 Add the three new action signatures to the `AppStore` interface in `src/store/index.ts`

## 4. PhaseSwitcher Component

- [x] 4.1 Update `PhaseSwitcher` to accept a `phases: DiagramPhase[]` prop instead of rendering from a hardcoded constant
- [x] 4.2 Remove the internal `PHASES` constant from `PhaseSwitcher.tsx`
- [x] 4.3 Update all call sites of `PhaseSwitcher` (`DiagramCanvasView`, `SequenceDiagramView`) to pass `getPhaseOrder(diagram)` as the `phases` prop

## 5. PhaseEditorPopover Component

- [x] 5.1 Create `src/components/PhaseEditorPopover.tsx` with a popover triggered by a settings icon button in the toolbar
- [x] 5.2 List phases in order; first phase shows a lock icon and no delete button
- [x] 5.3 Each non-base phase has: an inline label input (calls `renameDiagramPhase` on change) and a delete icon button (calls `deleteDiagramPhase`)
- [x] 5.4 "Add Phase" button at the bottom calls `addDiagramPhase` with a default label ("Phase N")
- [x] 5.5 After adding a phase, focus the new phase's label input

## 6. Canvas Integration

- [x] 6.1 Add `PhaseEditorPopover` to `DiagramCanvasView` toolbar, adjacent to `PhaseSwitcher`
- [x] 6.2 In `DiagramCanvasView`, add a `useEffect` that resets `activePhase` to the first phase when the active phase ID is no longer in the diagram's phase list (handles deletion of active phase)

## 7. Fix Edge Drawing

- [x] 7.1 In `DiagramCanvasView.tsx`, remove the redundant `setEdges((eds) => addEdge(...))` call from the `onConnect` handler — rely solely on the store update + `useEffect` sync to add the new edge to local state
- [x] 7.2 Manually verify in the browser that dragging from a source handle to a target handle on another node creates a visible edge
- [x] 7.3 If edge drawing is still broken after 7.1, investigate whether `NodePropertiesPanel`'s `autoFocus` is capturing pointer events; if so, move `autoFocus` behind a `requestAnimationFrame` delay

## 8. Fix PNG Export

- [x] 8.1 In `src/lib/project-io.ts`, update `captureReactFlowPng` to target `.react-flow__renderer` (parent of both the viewport and the edges SVG) instead of `.react-flow__viewport`
- [x] 8.2 Add an `html-to-image` `filter` option to `captureReactFlowPng` that excludes `.react-flow__controls`, `.react-flow__minimap`, and `.react-flow__background` elements from the captured output
- [x] 8.3 Ensure `inlineSvgStyles` is still called on `rfRoot` (the `.react-flow` element) so edge stroke styles are inlined before capture
- [x] 8.4 Manually verify that an exported PNG shows edge lines and arrowhead markers

## 9. Tests

- [x] 9.1 Unit test `getPhaseOrder`: returns `phaseOrder` when present; returns default 3-phase list when absent
- [x] 9.2 Unit test `resolveDiagramPhase` with a 4-phase diagram to verify inheritance walks all phases
- [x] 9.3 Unit test `deleteDiagramPhase` store action: phase removed from list; override data cleaned up; no-op on first phase
- [x] 9.4 Unit test `addDiagramPhase`: new phase appended with correct label; `phaseOrder` initialised from default if missing
