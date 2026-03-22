## Context

The app uses ReactFlow (`@xyflow/react`) to render diagrams. Nodes are rendered as HTML elements, but edges (the connecting lines) are rendered as SVG `<path>` elements inside ReactFlow's internal `.react-flow__edges` SVG layer. Arrowhead markers are defined in `<defs>` blocks within that SVG.

PNG export is performed by `html-to-image`'s `toPng` utility, which serializes the target DOM element to an image by cloning the DOM, inlining styles, and rendering to a canvas. The current call passes `canvasContainerRef.current` — the wrapper `div` around the entire ReactFlow instance — as the capture target.

The root cause of missing edges is a **known limitation of `html-to-image` with SVG content**: when SVG elements use `<marker>` references (e.g., arrowheads defined in `<defs>`), `html-to-image` fails to serialize them correctly in its cloned document, causing the paths to render invisible or be dropped entirely. ReactFlow's edge SVG layer is also affected by CSS custom properties (variables) that may not be resolved when the DOM is cloned out of context.

## Goals / Non-Goals

**Goals:**
- Edges and their arrowhead markers appear in the exported PNG
- Export works for both single-phase and all-phases (ZIP) exports
- No regression in node appearance

**Non-Goals:**
- Changing the export format (PNG stays as PNG)
- Exporting interactive or animated diagram state
- Fixing any visual fidelity issues unrelated to edges

## Decisions

### Decision 1: Use `html-to-image` with `filter` + explicit SVG inlining

**Chosen approach:** Before calling `toPng`, clone the ReactFlow SVG edge layer and inline all `<marker>` `<defs>` directly into the SVG so they survive the DOM clone. Additionally, pass a `filter` function that forces SVG elements to be included rather than skipped.

**Alternative considered — Switch to a different library (e.g., `dom-to-image-more`):** Would require replacing the library across all export paths and introduces a new dependency. The SVG marker problem exists across most DOM-to-canvas libraries unless explicitly handled, so switching does not guarantee a fix.

**Alternative considered — Render edges separately as canvas paths:** Would require reimplementing edge rendering logic outside of ReactFlow, creating a maintenance burden and potential divergence.

**Alternative considered — Use `getViewportForBounds` + explicit canvas rendering:** ReactFlow provides `useReactFlow().getViewportForBounds()` which can be combined with `html-to-image`'s `width`/`height` options to capture only the viewport at a fixed size. This is the approach used in the [ReactFlow PNG export example](https://reactflow.dev). It also ensures edges within the viewport bounds are captured. This is the preferred approach as it is officially supported and sidesteps the SVG serialization issue by targeting the `.react-flow__viewport` element (which is a `<div>` transform wrapper, not an SVG root).

**Final decision:** Target `.react-flow__viewport` via `element.querySelector('.react-flow__viewport')` and pass explicit `width`/`height` matching the container dimensions to `toPng`. This avoids the SVG root serialization problem entirely while still capturing edge SVG children embedded inside the viewport transform.

### Decision 2: Export helper location

Keep changes inside `src/lib/project-io.ts` (`exportCanvasToPng` and `capturePng`). The `DiagramCanvasView` passes the container element; the fix adjusts how the element is targeted internally inside the helper, requiring no change to call sites.

## Risks / Trade-offs

- **[Risk] Edge labels (rendered as `foreignObject`/HTML via `EdgeLabelRenderer`)** may still be partially clipped if they extend beyond the viewport bounds. → Mitigation: Add small padding to the capture dimensions.
- **[Risk] `querySeletor('.react-flow__viewport')` fails if ReactFlow changes its internal class names.** → Mitigation: Fall back to the original element if the viewport element is not found.
- **[Risk] All-phases ZIP export switches phases with a 300ms delay** — the viewport element reference remains stable across phase switches so this is unaffected.
