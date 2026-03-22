## Why

When exporting a diagram canvas to PNG, the edges (lines connecting nodes) are missing from the output image. This is a data integrity issue — the exported PNG does not faithfully represent the diagram, making it unusable for documentation or sharing.

## What Changes

- Fix the `exportCanvasToPng` and `capturePng` functions in `src/lib/project-io.ts` so that ReactFlow edges (SVG paths) are fully captured in the PNG output.
- Ensure SVG elements rendered by ReactFlow — including edge paths, arrowhead markers, and edge labels — appear correctly in exported images.

## Capabilities

### New Capabilities
- `png-export-edges`: PNG export correctly includes all diagram edges and their arrowhead markers.

### Modified Capabilities
<!-- No spec-level requirement changes — this is a bug fix restoring intended behavior -->

## Impact

- `src/lib/project-io.ts` — `exportCanvasToPng` and `capturePng` functions
- `src/views/DiagramCanvasView.tsx` — export trigger, may need canvas element targeting adjustment
- `html-to-image` library usage — may require filter options or a different capture strategy to handle ReactFlow's SVG edge layer
