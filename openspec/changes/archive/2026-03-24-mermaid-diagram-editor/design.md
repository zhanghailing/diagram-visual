## Context

The app currently has three diagram types (c4-component, architecture, sequence) built on a custom node/edge model with ReactFlow for visual editing. Mermaid is already installed (v11) and used for import parsing (`mermaid-parser.ts`) and code generation (`diagram-phase.ts`), but there is no diagram type where Mermaid syntax is the primary source of truth. Users who want to create advanced Mermaid diagrams (ELK-layout flowcharts, ZenUML, etc.) have no path today.

## Goals / Non-Goals

**Goals:**
- Add a `mermaid` diagram type where the Mermaid code string is the canonical data.
- Provide a split-pane view: code editor on the left, live SVG render on the right.
- Support all Mermaid diagram types via the base `mermaid` package + optional plugins.
- Import: accept `.mmd` file upload or pasted Mermaid syntax.
- Export: download as `.mmd` (raw code), SVG, or PNG.
- Integrate `@mermaid-js/layout-elk` and `@mermaid-js/mermaid-zenuml` as opt-in plugins.

**Non-Goals:**
- Visual drag-drop canvas editing of Mermaid diagrams (code is the editor).
- Phase system support for Mermaid diagrams (phases apply to the custom node model only).
- Converting Mermaid diagrams to/from c4-component, architecture, or sequence types.
- Server-side rendering of Mermaid SVGs.

## Decisions

### 1. Mermaid code as source of truth (not nodes/edges)
**Decision**: Store raw Mermaid syntax in a `mermaidCode: string` field on `Diagram`. Do not map it to the existing node/edge model.
**Rationale**: The existing node/edge model is purpose-built for the three current types. Forcing Mermaid's open-ended syntax into that model would require brittle bidirectional conversion and would break for unsupported diagram types. Raw code is simpler, lossless, and forward-compatible.
**Alternative considered**: Parse Mermaid → nodes/edges and reuse ReactFlow canvas. Rejected because it can't represent all Mermaid diagram types and loses formatting/comments.

### 2. Client-side rendering via mermaid.render()
**Decision**: Use `mermaid.render(id, code)` in the browser to produce SVG output, displayed inside the view.
**Rationale**: Mermaid v11 supports async `render()` with full plugin support. No server dependency. The existing app is a pure SPA with no backend.
**Alternative considered**: Use a `<Mermaid>` React wrapper library. Rejected to avoid an extra dependency and to retain direct control over plugin initialization.

### 3. Plugin initialization at app startup
**Decision**: Call `mermaid.registerExternalDiagrams([zenuml])` and set `layout: 'elk'` support in `mermaid.initialize()` once at app startup (in `main.tsx` or a dedicated `mermaid-setup.ts`).
**Rationale**: Mermaid plugins must be registered before first render. Lazy registration on view mount causes race conditions.
**Alternative considered**: Register plugins only when the Mermaid view is opened. Rejected due to timing issues and the plugins are small enough to include up front.

### 4. Minimal data model change
**Decision**: Add `mermaidCode?: string` to the `Diagram` interface; add `'mermaid'` to `DiagramType`. Guard all node/edge logic with `diagram.type !== 'mermaid'`.
**Rationale**: Additive-only change means existing project files remain valid. No migration needed.

### 5. Code editor: plain textarea first
**Decision**: Use a `<textarea>` for the code editor in v1, with syntax highlighting as a follow-up.
**Rationale**: Avoids adding a heavy code editor dependency (CodeMirror, Monaco) for the initial implementation. The feature is useful without it.

## Risks / Trade-offs

- **ELK WASM load time** → `@mermaid-js/layout-elk` uses a WASM binary. First render may be slow. Mitigation: lazy-load the ELK plugin only when `elk` layout is detected in the diagram code.
- **Mermaid render errors** → Syntax errors throw inside `mermaid.render()`. Mitigation: wrap in try/catch and display error message in the preview pane instead of crashing.
- **SVG XSS** → Mermaid-generated SVGs are sanitized by the library itself (DOMPurify). Set SVG via `innerHTML` only in a sandboxed container; do not inject into the document root.
- **Bundle size** → Adding two Mermaid plugins increases bundle size. Mitigation: both plugins are dynamically imported; only loaded when the Mermaid view is mounted.

## Migration Plan

1. Install new packages (`@mermaid-js/layout-elk`, `@mermaid-js/mermaid-zenuml`).
2. Add `mermaidCode` field and `mermaid` type to the data model — backward-compatible, no file migration.
3. Add plugin setup module and wire into `main.tsx`.
4. Implement `MermaidDiagramView`.
5. Add routing in `DiagramListView` / `App.tsx`.
6. Add import/export handlers.

Rollback: remove the `mermaid` case from the type union and delete the new view — no data loss for existing project files.

## Open Questions

- Should `mermaidCode` have a default template (e.g., `flowchart LR\n  A --> B`) when creating a new Mermaid diagram?
- Should the ELK plugin be always bundled or fully optional via a user setting?
