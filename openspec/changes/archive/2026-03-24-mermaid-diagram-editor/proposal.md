## Why

The three existing diagram types (C4 component, architecture, sequence) use a custom internal model and partial Mermaid integration. There is no native Mermaid editing experience where users can author, view, and edit diagrams directly in Mermaid syntax using the full Mermaid ecosystem — including advanced layout engines and diagram types like ZenUML. Adding a first-class Mermaid diagram type closes this gap and lets users leverage the entire Mermaid library without being constrained by the custom node/edge model.

## What Changes

- Add a new diagram type `mermaid` alongside the existing three types.
- New dedicated view `MermaidDiagramView` that renders diagrams using `mermaid` JS directly (no ReactFlow canvas).
- A split-pane editor: left side is a Mermaid syntax code editor, right side is the live-rendered SVG output.
- Support importing Mermaid syntax from the existing `MermaidImportDialog` flow (reuse parser).
- Support exporting the raw Mermaid code as a `.mmd` file and as a rendered SVG/PNG.
- Integrate optional Mermaid plugins: `@mermaid-js/layout-elk` (ELK-based layout) and `@mermaid-js/mermaid-zenuml` (ZenUML diagrams).
- Add `mermaid` to the diagram type union in the data model.

## Capabilities

### New Capabilities
- `mermaid-diagram-view`: A dedicated view for creating and editing Mermaid diagrams with a live split-pane editor, SVG preview, and plugin support.
- `mermaid-diagram-io`: Import Mermaid `.mmd` files or pasted syntax into a Mermaid diagram; export as `.mmd`, SVG, or PNG.

### Modified Capabilities
- None — existing diagram types and their specs are unchanged. The `mermaid` type is additive to the type union.

## Impact

- **Data model** (`src/types/index.ts`): Add `mermaid` to the `DiagramType` union; add `mermaidCode: string` field to `Diagram`.
- **Store** (`src/store/index.ts`): Handle creation of diagrams with type `mermaid`.
- **Routing/view switching** (`src/views/DiagramListView.tsx`, `src/App.tsx`): Route `mermaid` diagrams to the new `MermaidDiagramView`.
- **New packages**: `@mermaid-js/layout-elk`, `@mermaid-js/mermaid-zenuml`.
- **Existing mermaid package** (v11) already installed — no version change needed.
- No breaking changes to existing diagram types or project file format (additive schema change).
