## Context

The application already uses `@xyflow/react` (React Flow) for the dependency graph view and `dagre` for auto-layout. The store is managed with `zustand`. There are no existing diagram authoring capabilities — only read-only/generated views.

The target use case is a solution architect working through a multi-phase migration:
- **As-is**: current system with separate gateway, auth API, frontend(s), backend(s), and ADFS
- **Phase 1**: gateway and auth API merged into a new gateway
- **Phase 2**: ADFS replaced with PingOne; frontend/backend services migrated one by one

The architect needs C4 component diagrams, architecture diagrams, and sequence diagrams — each maintained across all three phases without duplicating shared elements.

## Goals / Non-Goals

**Goals:**
- Interactive canvas (drag, drop, connect, pan, zoom) built on `@xyflow/react`
- Three diagram types: C4 Component, Architecture (free-form), Sequence
- Phase switcher: as-is → phase 1 → phase 2; shared elements inherited, per-phase overrides applied
- Mermaid import: parse flowchart/graph, C4Context/Component, and sequenceDiagram syntax into canvas nodes/edges
- Persistent element positions stored in zustand + persisted to project file (localStorage or JSON export)
- Read-only phase diff: highlight what changed between phases

**Non-Goals:**
- Full Mermaid feature parity (only subset needed for import)
- Real-time collaboration
- Export to image/PDF (out of scope for initial version)
- Editing sequence diagram lifeline ordering via drag (text-based ordering only)

## Decisions

### 1. Canvas: React Flow (already available)
Use `@xyflow/react` for all diagram types except sequence diagrams, which use a purpose-built timeline-style layout.

**Alternatives considered:**
- `konva` / raw canvas — more flexible but loses edge routing, selection, and minimap for free
- `mermaid` render-only — no interactivity or position persistence

### 2. Diagram type rendering
- **C4 Component**: Custom node types (`PersonNode`, `SystemNode`, `ContainerNode`, `ComponentNode`) with C4-style styling; edges typed as `Rel`
- **Architecture**: Generic box/cylinder/actor nodes with labeled edges; closest to free-form drawing
- **Sequence**: Separate non-React-Flow renderer using a vertical swimlane layout. Participants are columns; messages are horizontal arrows at increasing y-positions. Drag to reorder participants; click to edit messages.

**Why separate renderer for sequence?** React Flow is node+edge graph-oriented; sequence diagrams are inherently ordered lists of messages between fixed participants. Forcing them into a graph model adds complexity without benefit.

### 3. Phase model
Each diagram has a `phases` map: `{ 'as-is': PhaseState, 'phase-1': PhaseState, 'phase-2': PhaseState }`. A `PhaseState` contains:
- `elements`: node/edge overrides for this phase (added, removed, or modified elements)
- `positions`: `{ [nodeId]: { x, y } }` per-phase position map

Nodes/edges defined in `as-is` are inherited by later phases unless explicitly overridden (hidden or modified). This avoids duplication.

**Why not separate diagrams per phase?** Shared elements would drift independently. Override model keeps a single source of truth.

### 4. Mermaid import
Use `mermaid`'s parser (or a lightweight hand-rolled parser for the subset needed) to convert:
- `graph`/`flowchart` → Architecture diagram nodes/edges
- `C4Component`/`C4Context` → C4 Component diagram
- `sequenceDiagram` → Sequence diagram

Auto-layout via `dagre` on import; positions saved after first render so the user can adjust.

**Alternatives:** Full `mermaid` render then extract SVG positions — fragile and couples layout to SVG internals.

### 5. Position persistence
Positions are stored in the zustand store under each diagram's phase state and persisted via the existing project-io mechanism (JSON export/import). On canvas mount, saved positions are applied as initial node positions.

## Risks / Trade-offs

- **Mermaid parser scope creep** → Mitigation: parse only the 3 diagram types explicitly needed; show a clear error for unsupported syntax
- **Sequence diagram custom renderer maintenance** → Mitigation: keep it simple — no routing, just vertical ordering; expand later
- **Phase override complexity** → Mitigation: start with only add/remove/hide overrides; style overrides are phase 2 scope
- **Large diagrams perf in React Flow** → Mitigation: use `nodesDraggable` + virtualization; dagre layout only on import, not on every render

## Open Questions

- Should sequence diagram participant order be persisted per-phase or globally?
- Should Mermaid import create a new diagram or merge into the current one?
- Is there a target for max elements per diagram (affects virtualization decision)?
