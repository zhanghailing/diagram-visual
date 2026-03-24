## 1. Dependencies & Setup

- [x] 1.1 Install `@mermaid-js/layout-elk` and `@mermaid-js/mermaid-zenuml` packages
- [x] 1.2 Create `src/lib/mermaid-setup.ts` that initializes Mermaid with plugins (`registerExternalDiagrams`, `initialize`)
- [x] 1.3 Import and call `mermaid-setup.ts` in `main.tsx` before app renders

## 2. Data Model

- [x] 2.1 Add `'mermaid'` to the `DiagramType` union in `src/types/index.ts`
- [x] 2.2 Add `mermaidCode?: string` field to the `Diagram` interface in `src/types/index.ts`
- [x] 2.3 Guard all node/edge-only logic in the store and views with `diagram.type !== 'mermaid'` checks

## 3. Core Mermaid View

- [x] 3.1 Create `src/views/MermaidDiagramView.tsx` with a split-pane layout (left: textarea editor, right: SVG preview)
- [x] 3.2 Implement live rendering using `mermaid.render()` on code change (debounced ~300ms)
- [x] 3.3 Add error handling: catch render errors and display a readable message in the preview pane
- [x] 3.4 Persist code changes back to the Zustand store on edit

## 4. Routing

- [x] 4.1 Update `src/views/DiagramListView.tsx` to show `mermaid` as a selectable diagram type when creating a new diagram
- [x] 4.2 Update the diagram view router in `src/App.tsx` (or equivalent) to render `MermaidDiagramView` when `diagram.type === 'mermaid'`
- [x] 4.3 Set a default `mermaidCode` template (`flowchart LR\n  A --> B`) when creating a new Mermaid diagram in the store

## 5. Import

- [x] 5.1 Add a Mermaid import option in `MermaidDiagramView` (reuse or adapt `MermaidImportDialog`) that sets `mermaidCode` on the current diagram
- [x] 5.2 Add `.mmd` file upload support: read file contents and set as `mermaidCode`
- [x] 5.3 Validate imported code with `mermaid.render()` before committing; show error and abort if invalid

## 6. Export

- [x] 6.1 Add "Export as .mmd" button in `MermaidDiagramView` that downloads `<diagram-name>.mmd` with raw Mermaid code
- [x] 6.2 Add "Export as SVG" button that downloads the rendered SVG markup as `<diagram-name>.svg`
- [x] 6.3 Add "Export as PNG" button using `html-to-image` (already installed) on the SVG container to produce `<diagram-name>.png`

## 7. Testing & Cleanup

- [x] 7.1 Verify ZenUML diagram renders correctly with the `zenuml` plugin
- [x] 7.2 Verify ELK layout renders when `%%{init: {"layout": "elk"}}%%` is specified
- [x] 7.3 Verify existing project files with no `mermaidCode` field load without errors
- [x] 7.4 Verify existing diagram types (c4-component, architecture, sequence) are unaffected
