## Why

Three bugs in the diagram authoring canvas block basic workflow: users cannot customise or extend phases, can no longer draw edges between nodes, and PNG exports continue to omit edges despite a prior fix attempt. All three make the tool unusable for its core purpose of visualising multi-phase migration diagrams.

## What Changes

- **Implement phase editing UI** — complete the `diagram-custom-phases` change tasks: generalise `PhaseId` to `string`, add `phaseOrder` to the `Diagram` type, add store actions for add/rename/delete phase, and introduce the `PhaseEditorPopover` component in the canvas toolbar.
- **Fix edge drawing regression** — restore the ability to drag-connect nodes in the ReactFlow canvas; investigate the `onConnect`/state-sync interaction and ensure handles are interactable after the recent `EdgePropertiesPanel` integration.
- **Fix PNG export edges** — the current `captureReactFlowPng` targets `.react-flow__viewport` but ReactFlow renders edge SVG elements (and their `<defs>` arrowhead markers) outside that element; switch capture target to include the full edge layer while excluding UI controls.

## Capabilities

### New Capabilities
- `phase-editor`: UI for adding, renaming, and deleting phases on a diagram (popover in the canvas toolbar); first phase is protected.

### Modified Capabilities
- `phase-management`: `PhaseId` becomes a generic `string`; `Diagram` gains a `phaseOrder: DiagramPhase[]` field; resolution and diff logic walks the diagram's phase array instead of a hardcoded constant; `PhaseSwitcher` renders from the diagram's phase list.
- `png-export-edges`: PNG export must capture the full ReactFlow edge layer including SVG `<defs>` marker elements so arrowheads appear in exported images.

## Impact

- `src/types/index.ts` — `PhaseId` → `string`; new `DiagramPhase` interface; `Diagram.phaseOrder` field
- `src/lib/diagram-phase.ts` — replace hardcoded `PHASE_ORDER` with `getPhaseOrder(diagram)`
- `src/store/index.ts` — add `addDiagramPhase`, `renameDiagramPhase`, `deleteDiagramPhase` actions
- `src/components/PhaseSwitcher.tsx` — accept `phases` prop
- `src/components/PhaseEditorPopover.tsx` — new component
- `src/views/DiagramCanvasView.tsx` — wire phase editor; fix edge drawing (investigate `onConnect` + `useEffect`/`useEdgesState` interaction)
- `src/lib/project-io.ts` — fix `captureReactFlowPng` to capture `.react-flow__renderer` (or equivalent) instead of `.react-flow__viewport` so edge SVG and `<defs>` are included
