## ADDED Requirements

### Requirement: Edge label is draggable
Diagram edge labels (on C4/architecture diagram edges with a `label` or `technology` value) SHALL be draggable by the user to reposition them relative to the edge midpoint.

#### Scenario: User drags an edge label
- **WHEN** the user initiates a pointer drag on an edge label
- **THEN** the label moves with the pointer in real time

#### Scenario: Label stays within reasonable range
- **WHEN** the user releases the pointer after dragging
- **THEN** the label remains at the dropped position until the user moves it again

### Requirement: Label offset is persisted per edge
The custom label position offset (`{ x, y }` delta from midpoint) SHALL be stored on the edge in the diagram data model and persisted with the project.

#### Scenario: Offset survives save and reload
- **WHEN** the user repositions an edge label and then saves or the project auto-saves
- **THEN** reloading the project shows the label at the same custom position

#### Scenario: Offset survives file export and import
- **WHEN** the project is exported to `.migplan.json` and re-imported
- **THEN** the edge label appears at the same custom position

### Requirement: Default midpoint used when no offset is set
When no custom `labelOffset` is stored on an edge, the label SHALL render at the computed midpoint of the edge path (existing behavior).

#### Scenario: New edge has no custom offset
- **WHEN** a new edge is created with no prior `labelOffset`
- **THEN** the label renders at the geometric midpoint of the edge

#### Scenario: Existing project with no offset field loads correctly
- **WHEN** a project saved before this feature is loaded
- **THEN** all edge labels render at their default midpoint positions with no errors

### Requirement: Label offset is reflected in PNG export
The PNG export (single phase and all-phases ZIP) SHALL capture the edge label at its custom offset position.

#### Scenario: Export captures custom label position
- **WHEN** the user exports a diagram phase as PNG after repositioning an edge label
- **THEN** the exported image shows the label at the repositioned location
