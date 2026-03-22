## ADDED Requirements

### Requirement: C4 Component diagram type
The system SHALL support a C4 Component diagram type with node types: Person, Software System, Container, and Component, rendered with C4-standard visual style (colored boxes with stereotype labels).

#### Scenario: User creates a C4 Component diagram
- **WHEN** the user selects "C4 Component" as the diagram type when creating a new diagram
- **THEN** the canvas palette shows Person, Software System, Container, and Component node types

#### Scenario: C4 relationship edge is created
- **WHEN** the user connects two C4 nodes
- **THEN** the edge is rendered as a labeled arrow and prompts for a relationship label and technology

### Requirement: Architecture diagram type
The system SHALL support a free-form architecture diagram type with generic node types: Box, Database (cylinder), Actor, and Queue, and labeled directed edges.

#### Scenario: User creates an architecture diagram
- **WHEN** the user selects "Architecture" as the diagram type
- **THEN** the canvas palette shows Box, Database, Actor, and Queue node types

#### Scenario: Architecture edge has optional label
- **WHEN** the user creates an edge between two architecture nodes
- **THEN** the user can optionally add a label to describe the interaction

### Requirement: Sequence diagram type
The system SHALL support a sequence diagram type with a swimlane-style renderer showing participants as vertical columns and messages as horizontal arrows at increasing vertical positions.

#### Scenario: User creates a sequence diagram
- **WHEN** the user selects "Sequence" as the diagram type
- **THEN** the view shows a participant row at the top and a message list below

#### Scenario: User adds a participant
- **WHEN** the user clicks "Add Participant" and enters a name
- **THEN** a new vertical swimlane column is added to the sequence diagram

#### Scenario: User adds a message between participants
- **WHEN** the user clicks "Add Message", selects source and target participants, and enters a label
- **THEN** a new horizontal arrow is appended below the existing messages

#### Scenario: User reorders participants
- **WHEN** the user drags a participant column header to a new position
- **THEN** the participant columns reorder accordingly and all messages update their horizontal positions

### Requirement: Diagram type is set at creation and immutable
The system SHALL require the user to select a diagram type when creating a new diagram and SHALL NOT allow changing the type after creation.

#### Scenario: User attempts to change diagram type
- **WHEN** the user views diagram settings for an existing diagram
- **THEN** the diagram type field is displayed as read-only
