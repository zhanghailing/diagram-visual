## Why

When designing system migrations, architects need to produce multiple diagram types (C4 component, architecture, sequence) across multiple phases (as-is, phase 1, phase 2), but existing tools lack phase-aware views and require re-drawing shared elements from scratch. A dedicated authoring tool with Mermaid import and persistent element positions will dramatically reduce the time and error rate when maintaining multi-phase diagram sets.

## What Changes

- Add a diagram authoring canvas with drag-and-drop element placement
- Support C4 component diagrams, architecture diagrams, and sequence diagrams
- Support phase-aware diagram views: as-is, phase 1 (gateway + auth API merged into new gateway), phase 2 (ADFS replaced with PingOne, incremental frontend/backend migration)
- Import diagrams from Mermaid syntax (parse and render as interactive canvas elements)
- Persist element positions per diagram so layout is preserved across sessions
- Allow elements to be shared/reused across phases with per-phase overrides (e.g., visibility, label, state)

## Capabilities

### New Capabilities
- `diagram-canvas`: Interactive canvas for creating and editing diagrams with drag-and-drop, zoom, pan, and element selection
- `diagram-types`: Support for C4 component diagrams, architecture diagrams, and sequence diagrams with type-specific element palettes and rendering rules
- `phase-management`: Define and switch between diagram phases (as-is, phase 1, phase 2); elements can be shared across phases with per-phase visibility and state overrides
- `mermaid-import`: Parse Mermaid graph/sequence/C4 syntax and convert to canvas elements with auto-layout
- `position-persistence`: Save and restore element positions per diagram per phase using local storage or project file

### Modified Capabilities
<!-- none -->

## Impact

- New views/components added alongside existing plan visualization views
- No breaking changes to existing migration plan types or store
- Position data stored in project state (extends existing store shape)
- Mermaid parsing requires a new dependency (e.g., `mermaid` or `@mermaid-js/mermaid-core`)
- Canvas rendering may require `reactflow` or similar (already used or to be added)
