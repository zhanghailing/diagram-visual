## 1. Foundation & Data Model

- [x] 1.1 Define TypeScript types for `Diagram`, `DiagramType`, `PhaseId`, `PhaseState`, `NodeOverride`, `EdgeOverride` in `src/types/index.ts`
- [x] 1.2 Add `diagrams` slice to zustand store with CRUD actions: `createDiagram`, `deleteDiagram`, `updateDiagramElement`, `setNodePosition`, `setPhaseOverride`
- [x] 1.3 Extend project-io serialization to include diagram data and node positions in JSON export/import
- [x] 1.4 Add `mermaid` npm dependency for Mermaid parsing

## 2. Diagram Canvas (React Flow)

- [x] 2.1 Create `DiagramCanvasView.tsx` with a React Flow canvas, minimap, controls, and background grid
- [x] 2.2 Implement element palette sidebar with drag-to-canvas support (generic node type for now)
- [x] 2.3 Wire node drag-end event to dispatch `setNodePosition` to the store with manual-position flag
- [x] 2.4 Wire edge creation (onConnect) to dispatch `updateDiagramElement` for new edges
- [x] 2.5 Wire Delete/Backspace key to remove selected nodes and their edges
- [x] 2.6 Add node property side panel that shows on node selection (label, type, description)

## 3. Diagram Types

- [x] 3.1 Create C4 node types: `C4PersonNode`, `C4SystemNode`, `C4ContainerNode`, `C4ComponentNode` with C4-style styling
- [x] 3.2 Create architecture node types: `BoxNode`, `DatabaseNode`, `ActorNode`, `QueueNode`
- [x] 3.3 Create labeled directed edge type for C4 (`RelEdge`) with relationship label and technology fields
- [x] 3.4 Implement diagram type palette: show correct node types in palette based on active diagram type
- [x] 3.5 Implement `SequenceDiagramView.tsx` with participant columns and message rows (non-React-Flow renderer)
- [x] 3.6 Add "Add Participant" and "Add Message" controls to sequence diagram view
- [x] 3.7 Implement drag-to-reorder for sequence diagram participant columns

## 4. Phase Management

- [x] 4.1 Implement phase switcher toolbar component (`PhaseSwitcher.tsx`) with tabs: as-is / phase-1 / phase-2
- [x] 4.2 Implement phase element resolution: merge base phase elements with current phase overrides (add/hide/modify)
- [x] 4.3 Add per-node/edge context menu with "Hide in this phase" and "Mark as new in this phase" actions
- [x] 4.4 Implement phase override for node labels: save label edit as phase override when a non-base phase is active
- [x] 4.5 Implement `PhaseDiffView.tsx`: show added (green), removed (red), modified (yellow) elements between two selected phases

## 5. Mermaid Import

- [x] 5.1 Create `MermaidImportDialog.tsx` with a textarea, diagram type detection, and import/cancel buttons
- [x] 5.2 Implement `parseMermaidFlowchart(text)` utility: parse `graph`/`flowchart` syntax into `{nodes, edges}`
- [x] 5.3 Implement `parseMermaidC4(text)` utility: parse `C4Component`/`C4Context` syntax into typed C4 nodes and `Rel` edges
- [x] 5.4 Implement `parseMermaidSequence(text)` utility: parse `sequenceDiagram` syntax into participants and messages
- [x] 5.5 Apply dagre auto-layout to imported flowchart and C4 nodes before adding to store
- [x] 5.6 Display descriptive error in dialog for unsupported diagram types and parse errors
- [x] 5.7 Add "Import from Mermaid" button to diagram canvas toolbar that opens the import dialog

## 6. Position Persistence

- [x] 6.1 Ensure `setNodePosition` in store sets a `manuallyPositioned: true` flag on the node
- [x] 6.2 Implement "Re-layout All" toolbar action: run dagre on all nodes and clear `manuallyPositioned` flags
- [x] 6.3 Verify that partial auto-layout (on Mermaid import) skips nodes with `manuallyPositioned: true`
- [x] 6.4 Verify positions survive project export + import round-trip (integration test)

## 7. Navigation & Wiring

- [x] 7.1 Add "Diagrams" tab/section to main navigation alongside existing views
- [x] 7.2 Create `DiagramListView.tsx` with list of diagrams, "New Diagram" button (prompts for name and type), and delete action
- [x] 7.3 Route from diagram list to `DiagramCanvasView` or `SequenceDiagramView` based on diagram type
- [x] 7.4 Add diagram name and type to canvas toolbar header

## 8. Tests

- [x] 8.1 Unit test `parseMermaidFlowchart` with valid and invalid inputs
- [x] 8.2 Unit test `parseMermaidC4` with valid C4Component syntax
- [x] 8.3 Unit test `parseMermaidSequence` with valid sequenceDiagram syntax
- [x] 8.4 Unit test phase element resolution (inheritance + overrides)
- [x] 8.5 Unit test position persistence: manual flag set on drag, preserved through partial re-layout
