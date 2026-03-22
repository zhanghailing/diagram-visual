## Context

The app uses ReactFlow (`@xyflow/react`) for diagram rendering. Edge labels are rendered via `EdgeLabelRenderer` (a portal into the ReactFlow pane) using absolute CSS transforms positioned at a computed midpoint (`labelX, labelY`) from `getStraightPath`. The two edge renderers affected are:

- `RelEdge.tsx` — C4/architecture diagram edges with `label` and `technology` fields
- `DependencyEdgeComponent.tsx` — dependency graph edges (label is auto-generated, not user-editable)

Edge data lives in `DiagramEdgeBase` (for diagram edges) and `DependencyEdge` (for dependency edges). The entire project is persisted as JSON to localStorage and exported as `.migplan.json`. Export (PNG/ZIP) uses `html-to-image` with `inlineSvgStyles` to capture the ReactFlow canvas.

Only `RelEdge` diagram edges will get user-movable labels in this change — dependency edges have generated labels and no user-authoring surface.

## Goals / Non-Goals

**Goals:**
- Users can drag an edge label to a new position relative to the edge midpoint
- The label offset (`{ x, y }`) is stored per edge in the diagram data model
- Offset persists through save/load (localStorage + `.migplan.json`)
- Offset is honored in PNG export (html-to-image captures rendered positions)
- No custom offset → existing midpoint behavior unchanged (backwards compatible)

**Non-Goals:**
- Moving labels on `DependencyEdgeComponent` edges (auto-generated, read-only labels)
- Per-phase label offset overrides (offset is on the base edge; out of scope)
- Snapping, alignment guides, or reset-to-default UI (keep it simple)
- Sequence diagram messages

## Decisions

### 1. Store offset as `{ x, y }` delta on `DiagramEdgeBase`

Add `labelOffset?: { x: number; y: number }` to `DiagramEdgeBase`. This is the displacement from the computed midpoint in pixels.

**Why**: Minimal schema change; backward compatible (undefined = midpoint); survives layout changes as long as the edge endpoints don't move dramatically. Alternative was storing an absolute canvas position, but that breaks when nodes are moved.

### 2. Drag the label div directly with pointer events

In `RelEdge`, convert the label container to a draggable element. On `pointerdown`, track delta from start position; on `pointerup`, dispatch the new offset to the store. Use `useCallback` + `useState` for local drag state, and call `updateDiagramEdgeLabelOffset(edgeId, offset)` store action on release.

**Why**: Keeps drag logic self-contained in the edge component. ReactFlow's `EdgeLabelRenderer` renders into a div above the SVG, so pointer events work naturally. No need for a separate drag library — a simple pointer event approach is sufficient. Alternative was using React DnD or Framer Motion, but both add unnecessary bundle weight for this simple case.

### 3. Add `updateDiagramEdgeLabelOffset` to the Zustand store

New store action that patches `labelOffset` on the matching edge in `diagram.baseEdges` (and `phaseState.addedEdges` if needed). Triggers auto-save.

**Why**: Consistent with how `setDiagramNodePosition` works for node dragging.

### 4. Export: no extra work needed

Because `html-to-image` captures the rendered DOM, and label position is applied via CSS transform at render time, the export will automatically reflect custom label positions. The existing `inlineSvgStyles` pipeline handles SVG styling; label divs are plain HTML and already captured correctly.

**Why**: Verified by the recent "fix export edge label" commit — label rendering in export works via DOM capture.

### 5. Mermaid export: ignore offset

`resolvedPhaseToMermaid` outputs `-->|label|` syntax which has no concept of label position. Offset is silently ignored.

**Why**: Mermaid controls layout; there is no API to position labels.

## Risks / Trade-offs

- **Offset breaks if edge endpoints move far** → Mitigation: acceptable UX trade-off; user can re-drag. Document in UI as "drag to reposition".
- **Pointer events inside ReactFlow pane** → `EdgeLabelRenderer` output is in `.react-flow__edgelabel` which has `pointer-events: none` by default in some ReactFlow versions. Mitigation: set `pointerEvents: 'all'` on the label container (already done for click handlers in the existing code pattern).
- **Phase overrides don't carry offset** → Mitigation: out of scope for this change; base edge offset is sufficient for MVP.

## Migration Plan

- `labelOffset` is optional, so existing saved projects load without change (undefined = midpoint).
- No schema version bump required.
- Rollback: remove the field from model and renderer — no data loss since it's additive.
