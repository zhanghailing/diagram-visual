## ADDED Requirements

### Requirement: Import Mermaid flowchart/graph as Architecture diagram
The system SHALL parse Mermaid `graph` and `flowchart` syntax and convert nodes and edges into an Architecture diagram on the canvas, applying dagre auto-layout on import.

#### Scenario: User imports a valid Mermaid flowchart
- **WHEN** the user pastes valid Mermaid `flowchart LR` or `graph TD` syntax into the import dialog and confirms
- **THEN** nodes and directed edges appear on the canvas with dagre auto-layout applied

#### Scenario: Node labels are preserved from Mermaid
- **WHEN** a Mermaid node has an inline label (e.g., `A[My Service]`)
- **THEN** the imported canvas node displays "My Service" as its label

### Requirement: Import Mermaid C4 diagram as C4 Component diagram
The system SHALL parse Mermaid `C4Component` and `C4Context` syntax and convert elements to the appropriate C4 node types (Person, System, Container, Component) on the canvas.

#### Scenario: User imports a Mermaid C4Component diagram
- **WHEN** the user pastes valid `C4Component` Mermaid syntax and confirms
- **THEN** a C4 Component diagram is created with correctly typed nodes and labeled `Rel` edges

### Requirement: Import Mermaid sequenceDiagram as Sequence diagram
The system SHALL parse Mermaid `sequenceDiagram` syntax and create a Sequence diagram with the corresponding participants and messages.

#### Scenario: User imports a Mermaid sequence diagram
- **WHEN** the user pastes valid `sequenceDiagram` Mermaid syntax and confirms
- **THEN** a Sequence diagram is created with participants and messages in the correct order

### Requirement: Unsupported Mermaid syntax shows a clear error
The system SHALL display a descriptive error message when the pasted Mermaid syntax is unsupported or invalid, without creating a partial diagram.

#### Scenario: User imports unsupported Mermaid syntax
- **WHEN** the user pastes Mermaid syntax for an unsupported type (e.g., `gantt`, `pie`)
- **THEN** the import dialog displays an error message stating the type is not supported and no diagram is created

#### Scenario: User imports malformed Mermaid syntax
- **WHEN** the user pastes syntactically invalid Mermaid text
- **THEN** the import dialog displays a parse error message with the offending line if possible

### Requirement: Imported positions are editable after import
The system SHALL apply auto-layout on import but allow the user to manually reposition elements after import, with positions persisted.

#### Scenario: User repositions an imported node
- **WHEN** the user drags an imported node to a new position after import
- **THEN** the new position is saved and the auto-layout position is discarded for that node
