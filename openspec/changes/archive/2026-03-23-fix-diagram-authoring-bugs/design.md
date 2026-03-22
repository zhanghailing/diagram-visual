## Context

Three regressions / unimplemented features block the diagram authoring canvas:

1. **Phase editing** — The `diagram-custom-phases` change was fully specified but never applied. `PhaseId` remains a hardcoded union `'as-is' | 'phase-1' | 'phase-2'`, `PhaseSwitcher` renders from a constant, and no phase editor UI exists.

2. **Edge drawing regression** — After recent changes (addition of `EdgePropertiesPanel`, modification of `DiagramCanvasView`), users can no longer drag-connect nodes. The `onConnect` callback and ReactFlow setup appear correct in isolation; the likely culprit is a state-sync conflict: `onConnect` calls both `updateDiagramElement` (store) and `setEdges` (local), but the `useEffect([rfEdges])` sync may race and overwrite the optimistic local edge addition before the re-render cycle completes, or a CSS/z-index regression is blocking handle interaction.

3. **PNG export still missing edges** — `captureReactFlowPng` was changed to target `.react-flow__viewport`, but ReactFlow renders edges in a sibling `<svg class="react-flow__edges">` element that is NOT inside `.react-flow__viewport`. The arrowhead `<marker>` elements in `<defs>` are also outside the viewport subtree. So capturing only the viewport omits the entire edge layer.

## Goals / Non-Goals

**Goals:**
- Implement phase editing UI (add/rename/delete phases) via `PhaseEditorPopover` in the canvas toolbar
- Fix edge drawing so users can drag-connect nodes reliably
- Fix PNG export to include the edge SVG layer and arrowhead markers in all exported images

**Non-Goals:**
- Redesigning the phase data model beyond what `diagram-custom-phases` specified
- Supporting SVG or PDF export formats
- Sequence diagram phase editing (deferred)

## Decisions

### Phase editing: follow diagram-custom-phases tasks verbatim
The `diagram-custom-phases` change already contains a fully-specified tasks.md. All tasks in that file are unstarted. This change implements them as written, with no deviation. Rationale: the spec was reviewed and accepted; re-specifying would create drift.

### Edge drawing: remove optimistic `setEdges` call from `onConnect`
The `onConnect` handler currently calls both `updateDiagramElement` (writes to Zustand) and `setEdges((eds) => addEdge(..., eds))` (writes to local React state). The `useEffect([rfEdges, setEdges])` then overwrites local state whenever the store-derived `rfEdges` changes. This dual-write is the likely race condition. Fix: remove the redundant `setEdges` call from `onConnect` — the `useEffect` sync will pick up the new edge from the store within the same render cycle.

If removing the optimistic call still doesn't restore edge drawing, a secondary investigation will check whether the `NodePropertiesPanel` (which uses `autoFocus`) captures pointer events that prevent ReactFlow handle interaction, or whether a CSS regression hides handles.

### PNG export: capture `.react-flow__renderer` and filter UI controls
Switch the capture target from `.react-flow__viewport` to `.react-flow__renderer` (the parent of both the viewport transform div and the edges SVG). This ensures the `<svg class="react-flow__edges">` — including its `<defs>` arrowhead markers — is included in the capture. Apply an `html-to-image` `filter` function to exclude `.react-flow__controls`, `.react-flow__minimap`, and `.react-flow__background` elements so they don't appear in the exported image. Width/height come from the `.react-flow` root's `getBoundingClientRect`.

Alternative considered: stay with `.react-flow__viewport` and manually clone+inject `<defs>` — rejected because it requires DOM surgery and will break whenever ReactFlow changes its internal SVG structure.

## Risks / Trade-offs

- **Phase type widening** (`PhaseId` → `string`) is a **BREAKING** data model change. Existing projects serialised to localStorage use string literal IDs (`'as-is'`, `'phase-1'`, `'phase-2'`), which remain valid as plain `string`, so no migration is needed. TypeScript call sites that pass literal `PhaseId` values must be updated. The store's `isBase = phase === 'as-is'` check is string comparison and continues to work.
- **Edge drawing fix** removes the optimistic local state update. If the Zustand→prop→memo→effect cycle takes more than one frame, there will be a one-frame flicker where the new edge is absent. This is acceptable given it removes a correctness bug.
- **PNG capture target change** may include ReactFlow's background dot pattern if `.react-flow__background` filtering doesn't cover all versions. Mitigated by the explicit filter list.

## Open Questions

- Does ReactFlow v12 render `.react-flow__edges` inside or outside `.react-flow__viewport`? The fix targets `.react-flow__renderer` which is safe either way, but confirming the actual DOM structure during implementation will allow a tighter selector if needed.
