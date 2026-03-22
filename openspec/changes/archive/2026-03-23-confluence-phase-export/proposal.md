## Why

Teams use this tool to model system architecture across migration phases (as-is, phase-1, phase-2), but sharing those diagrams with stakeholders requires screenshots or manual recreation. Confluence Server/DC is the primary documentation hub, and there is no built-in way to export phase diagrams from the app into Confluence pages.

## What Changes

- Add a **Export for Confluence** action to each phase view in the Diagram Canvas
- Export each resolved phase as a PNG image (one file per phase)
- Allow exporting all phases at once as a ZIP of PNGs, ready to attach to a Confluence page
- Regenerate the Mermaid code for a resolved phase and copy it to clipboard, as an alternative for teams with the Mermaid for Confluence app installed

## Capabilities

### New Capabilities

- `phase-png-export`: Export a resolved phase diagram (ReactFlow canvas) as a PNG image file via browser download
- `phase-mermaid-export`: Regenerate Mermaid flowchart syntax from a resolved phase's nodes and edges, and copy to clipboard
- `all-phases-zip-export`: Export all phases of a diagram as individual PNGs bundled in a ZIP file

### Modified Capabilities

## Impact

- `src/views/DiagramCanvasView.tsx`: Add export controls to the toolbar
- `src/lib/project-io.ts`: Add PNG export helper (html-to-image or native canvas API)
- `src/lib/diagram-phase.ts`: Used to resolve each phase before export (no changes needed)
- New dependency: `html-to-image` (for ReactFlow canvas → PNG) and `jszip` (for ZIP bundling)
- No API changes; pure client-side export
