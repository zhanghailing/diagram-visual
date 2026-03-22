## Context

The app renders phase diagrams using ReactFlow (`@xyflow/react`) on an HTML canvas. Each phase (as-is, phase-1, phase-2) is resolved client-side from a base diagram plus incremental overrides via `resolveDiagramPhase`. Currently, the only export is JSON (project file). Users need to paste diagrams into Confluence Server/DC pages for stakeholder documentation; the target audience is non-technical stakeholders who view Confluence but do not use this tool.

## Goals / Non-Goals

**Goals:**
- Export the currently visible phase as a PNG file (browser download)
- Export all phases of a diagram as a ZIP of PNGs in one action
- Generate Mermaid flowchart code from a resolved phase and copy to clipboard (for teams with Mermaid for Confluence installed)
- Zero backend required — everything runs in the browser

**Non-Goals:**
- Pushing diagrams directly to Confluence via API (requires Confluence credentials/OAuth; out of scope)
- Sequence diagram PNG export (different rendering path; defer to a follow-up)
- SVG export (PNG is sufficient for Confluence image attachment)
- Supporting Confluence Cloud (same Confluence features apply; not explicitly tested)

## Decisions

### 1. PNG capture via `html-to-image`

**Decision:** Use the `html-to-image` library (`toPng`) to capture the ReactFlow container DOM element as a PNG.

**Rationale:** ReactFlow renders to an SVG-backed HTML element, not a native `<canvas>`. The browser's native `canvas.toDataURL()` does not apply. `html-to-image` clones the DOM and serializes it to a canvas, handling foreign-object SVG correctly. It is well-maintained, has no server dependency, and is the standard approach for ReactFlow export.

**Alternative considered:** `dom-to-image-more` — similar API but less actively maintained and has known issues with SVG foreignObject content. Rejected.

### 2. ZIP bundling via `jszip`

**Decision:** Use `jszip` to bundle all phase PNGs into a single `.zip` download when exporting all phases.

**Rationale:** The browser cannot natively download multiple files at once without triggering multiple save dialogs. A ZIP gives users a single file they can extract and attach to Confluence as a batch. `jszip` is the de facto standard for client-side ZIP creation and has no native dependencies.

### 3. Mermaid re-generation from resolved phase

**Decision:** Write a `resolvedPhaseToMermaid(phase: ResolvedPhase): string` utility that converts nodes and edges back to Mermaid `flowchart LR` syntax.

**Rationale:** The app already parses Mermaid into its internal model (`mermaid-parser.ts`). The reverse direction is straightforward: each node becomes `id[label]` and each edge becomes `source --> target` (with optional label). This gives users an alternative for Confluence Mermaid macro without requiring any new dependencies.

**Alternative considered:** Storing the original Mermaid source per diagram and re-exporting that verbatim. Rejected because phases mutate nodes/edges (add, hide, modify), so the original source no longer reflects the resolved state.

### 4. Export controls placement

**Decision:** Add an "Export" dropdown button to the existing `DiagramCanvasView` toolbar (alongside the existing Auto-Layout and Import Mermaid buttons).

**Rationale:** Keeps controls discoverable and co-located with the canvas. A dropdown avoids cluttering the toolbar with three separate buttons.

## Risks / Trade-offs

- **html-to-image font/style capture**: External fonts or Tailwind utilities injected via `<link>` may not serialize correctly in the DOM clone. → Mitigation: test with the actual node types used (C4, Box, etc.) and inline critical styles if needed.
- **Large diagrams**: Very large canvases (many nodes) may produce oversized PNGs or hit canvas size limits in some browsers. → Mitigation: document a recommended zoom level before export; do not auto-scale in v1.
- **jszip download in Safari**: Safari handles `Blob` URL downloads differently. → Mitigation: use `file-saver` or `saveAs` pattern consistent with the existing JSON export in `project-io.ts`.
- **Mermaid label escaping**: Node labels with special characters (quotes, brackets) will break generated Mermaid syntax. → Mitigation: escape labels when generating Mermaid output.

## Open Questions

- Should exported PNGs include the phase name in the filename (e.g., `my-diagram-phase-1.png`)? → Default yes; derive from diagram name + phase ID.
- Should the Mermaid export use `flowchart LR` or `graph LR`? → Use `flowchart LR` (modern syntax, supported by Confluence Mermaid apps).
