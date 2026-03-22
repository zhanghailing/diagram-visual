## 1. Data Model

- [x] 1.1 Add `labelOffset?: { x: number; y: number }` to `DiagramEdgeBase` in `src/types/index.ts`
- [x] 1.2 Add `updateDiagramEdgeLabelOffset(diagramId, edgeId, offset)` action to the Zustand store in `src/store/index.ts` that patches `labelOffset` on the matching base edge and triggers auto-save

## 2. Edge Label Drag Interaction

- [x] 2.1 In `RelEdge.tsx`, read `data.labelOffset` and apply it as an additive offset to `labelX`/`labelY` when positioning the label container
- [x] 2.2 Add pointer event handlers (`onPointerDown`, `onPointerMove`, `onPointerUp`) to the label container div in `RelEdge.tsx` to implement drag-to-reposition
- [x] 2.3 Set `pointerEvents: 'all'` and `cursor: 'grab'` on the label container so it captures pointer events inside the ReactFlow pane
- [x] 2.4 On drag end (`onPointerUp`), dispatch `updateDiagramEdgeLabelOffset` with the accumulated delta so the offset is saved

## 3. Persistence & Serialization

- [x] 3.1 Verify that `labelOffset` round-trips correctly through JSON save/load (localStorage and `.migplan.json` file export/import) — no extra work expected since it's a plain JSON field, but confirm with a manual test

## 4. Export

- [x] 4.1 Verify PNG export captures the repositioned label correctly by exporting after dragging a label — no code change expected since `html-to-image` captures the rendered DOM, but confirm visually

## 5. Backwards Compatibility

- [x] 5.1 Confirm projects saved without `labelOffset` load without errors and render labels at the default midpoint (undefined offset = zero delta)
