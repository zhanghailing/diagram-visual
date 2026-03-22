## 1. Dependencies

- [x] 1.1 Install `html-to-image` package (`npm install html-to-image`)
- [x] 1.2 Install `jszip` package (`npm install jszip`)

## 2. Mermaid Re-generation Utility

- [x] 2.1 Add `resolvedPhaseToMermaid(phase: ResolvedPhase): string` to `src/lib/diagram-phase.ts` that converts resolved nodes and edges to `flowchart LR` Mermaid syntax
- [x] 2.2 Sanitize node IDs (strip hyphens) and escape special characters in node labels
- [x] 2.3 Include edge labels in output when present (`-->|label|`)

## 3. PNG Export Utility

- [x] 3.1 Add `exportCanvasToPng(element: HTMLElement, filename: string): Promise<void>` to `src/lib/project-io.ts` using `html-to-image`'s `toPng`
- [x] 3.2 Derive export filename as `<diagram-name>-<phase-id>.png` (kebab-case, space → hyphen)

## 4. ZIP Export Utility

- [x] 4.1 Add `capturePng` + `downloadZip` helpers to `src/lib/project-io.ts`; ZIP logic lives in the component handler
- [x] 4.2 Name the ZIP file `<diagram-name>-all-phases.zip`
- [x] 4.3 Name each PNG inside the ZIP as `<diagram-name>-<phase-id>.png`

## 5. Export UI in DiagramCanvasView

- [x] 5.1 Add an "Export" dropdown button to the `DiagramCanvasView` toolbar (alongside existing Auto-Layout and Import buttons)
- [x] 5.2 Add "Export PNG" menu item — calls `exportCanvasToPng` for the current phase
- [x] 5.3 Add "Copy Mermaid" menu item — calls `resolvedPhaseToMermaid`, writes to clipboard, shows "Copied!" confirmation for 2 seconds
- [x] 5.4 Add "Export All Phases (ZIP)" menu item — cycles through phases, captures each as PNG, bundles as ZIP
- [x] 5.5 Wire a `ref` to the ReactFlow container element so export functions receive the correct DOM node

## 6. Tests

- [x] 6.1 Unit test `resolvedPhaseToMermaid` with nodes/edges including special characters
- [x] 6.2 Unit test filename derivation logic for PNG and ZIP outputs
