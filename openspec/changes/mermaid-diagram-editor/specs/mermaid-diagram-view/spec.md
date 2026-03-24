## ADDED Requirements

### Requirement: Mermaid diagram type exists
The system SHALL support a `mermaid` diagram type alongside the existing `c4-component`, `architecture`, and `sequence` types. A Mermaid diagram SHALL store its content as a raw Mermaid syntax string (`mermaidCode`).

#### Scenario: Create new Mermaid diagram
- **WHEN** user creates a new diagram and selects type `mermaid`
- **THEN** a new diagram is created with `type: 'mermaid'` and a default `mermaidCode` template (e.g., `flowchart LR\n  A --> B`)

#### Scenario: Mermaid diagram appears in diagram list
- **WHEN** a project contains a diagram with `type: 'mermaid'`
- **THEN** it is listed in `DiagramListView` alongside other diagram types

### Requirement: Split-pane Mermaid editor
The system SHALL provide a `MermaidDiagramView` with a split-pane layout: a code editor pane on the left and a live SVG preview pane on the right.

#### Scenario: Code editor renders diagram live
- **WHEN** user edits the Mermaid code in the editor pane
- **THEN** the SVG preview updates to reflect the new code (on change or debounced)

#### Scenario: Syntax error shown in preview
- **WHEN** the Mermaid code contains a syntax error
- **THEN** the preview pane displays a human-readable error message instead of a broken SVG

#### Scenario: Routing to Mermaid view
- **WHEN** a diagram with `type: 'mermaid'` is opened
- **THEN** the app renders `MermaidDiagramView` instead of `DiagramCanvasView` or `SequenceDiagramView`

### Requirement: Mermaid plugin support
The system SHALL initialize `@mermaid-js/mermaid-zenuml` and `@mermaid-js/layout-elk` plugins so they are available when rendering Mermaid diagrams.

#### Scenario: ZenUML diagram renders
- **WHEN** the Mermaid code uses `zenuml` diagram type
- **THEN** the preview pane renders a valid ZenUML diagram SVG

#### Scenario: ELK layout renders
- **WHEN** the Mermaid code specifies `%%{init: {"layout": "elk"}}%%`
- **THEN** the diagram is laid out using the ELK engine

#### Scenario: Plugins initialized before first render
- **WHEN** the app starts
- **THEN** Mermaid plugins are registered before any diagram is rendered
