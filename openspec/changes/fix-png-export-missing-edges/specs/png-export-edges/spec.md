## ADDED Requirements

### Requirement: PNG export includes all diagram edges
The system SHALL render all edges (connecting lines and arrowheads) visible in the diagram canvas into the exported PNG image. An exported PNG SHALL NOT omit edges that are visible in the interactive canvas view.

#### Scenario: Export current phase with edges
- **WHEN** the user clicks "Export PNG (current phase)" on a diagram that has nodes connected by edges
- **THEN** the downloaded PNG file SHALL contain visible lines connecting the nodes

#### Scenario: Export includes arrowhead markers
- **WHEN** a diagram has directed edges (edges with arrowheads)
- **THEN** the exported PNG SHALL show arrowhead markers at the edge endpoints

#### Scenario: Export all phases ZIP includes edges
- **WHEN** the user clicks "Export All Phases (ZIP)"
- **THEN** each PNG inside the ZIP SHALL contain the edges for its respective phase

### Requirement: PNG export falls back gracefully
The system SHALL fall back to capturing the original container element if the ReactFlow viewport element cannot be found, so that export never silently produces a blank image.

#### Scenario: Viewport element not found
- **WHEN** `exportCanvasToPng` is called and `.react-flow__viewport` is not present in the container
- **THEN** the export SHALL proceed using the container element directly and SHALL NOT throw an unhandled error
