## ADDED Requirements

### Requirement: Define a state-level dependency edge
The system SHALL allow users to create a directed dependency edge specifying that a target component can only enter a target state if a source component is already in (or has passed through) a specified source state.

Edge structure: `source component + source state → target component + target state`.

#### Scenario: Create a dependency edge
- **WHEN** the user selects a source component, a source state, a target component, and a target state and confirms
- **THEN** the dependency edge is added to the project and rendered on the dependency graph

#### Scenario: Prevent self-referential edges
- **WHEN** the user attempts to create an edge where source and target component are the same
- **THEN** the system SHALL display a validation error and prevent creation

#### Scenario: Prevent duplicate edges
- **WHEN** the user attempts to create an edge that is identical to an existing edge
- **THEN** the system SHALL display a validation error indicating the edge already exists

### Requirement: Visualise the dependency graph
The system SHALL render all components and their dependency edges as an interactive directed graph. Components are nodes; edges are directed arrows labelled with the relevant states.

#### Scenario: Render graph on project load
- **WHEN** a project with components and dependency edges is loaded
- **THEN** all components appear as nodes and all edges appear as labelled directed arrows

#### Scenario: Pan and zoom
- **WHEN** the user pans or zooms the dependency graph view
- **THEN** the graph repositions or scales smoothly without loss of information

#### Scenario: Edge labels show state names
- **WHEN** a dependency edge is rendered
- **THEN** the edge label SHALL display both the source state and the target state names

### Requirement: Delete a dependency edge
The system SHALL allow users to delete a dependency edge. Deletion of an edge does not affect components or plans but may change the feasibility analysis results.

#### Scenario: Delete an edge
- **WHEN** the user selects an edge in the graph and confirms deletion
- **THEN** the edge is removed from the project and the graph updates immediately

### Requirement: Detect dependency cycles
The system SHALL detect and warn the user if a set of dependency edges would form a cycle (circular dependency), as cyclic dependencies make feasibility analysis undefined.

#### Scenario: Warn on cycle creation
- **WHEN** adding a new dependency edge would create a cycle in the dependency graph
- **THEN** the system SHALL display a warning explaining the cycle and prevent the edge from being saved

### Requirement: Persist dependency edges in project file
The system SHALL include all dependency edge definitions in the exported project JSON file.

#### Scenario: Export and reimport dependency data
- **WHEN** the user exports the project and reimports it
- **THEN** all dependency edges SHALL be fully restored and the graph rendered correctly
