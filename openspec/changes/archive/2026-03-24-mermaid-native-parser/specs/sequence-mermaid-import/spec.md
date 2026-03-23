## MODIFIED Requirements

### Requirement: Import Mermaid sequence diagram
The sequence diagram toolbar SHALL include an "Import Mermaid" button. When activated, the system SHALL display a dialog where the user can paste Mermaid `sequenceDiagram` syntax. On confirmation, the system SHALL parse the input using the Mermaid AST parser and append the resulting participants and messages to the currently active phase. The parser SHALL support `participant`, `actor`, all standard arrow types, and `%%` comments. Unsupported block constructs (`loop`, `alt`, `par`, `rect`, `note`) SHALL be skipped with a non-fatal warning.

#### Scenario: Open import dialog
- **WHEN** user clicks the "Import Mermaid" button in the sequence diagram toolbar
- **THEN** a dialog opens with a textarea for pasting Mermaid syntax

#### Scenario: Successful import of participants and messages
- **WHEN** user pastes valid Mermaid `sequenceDiagram` syntax and confirms
- **THEN** participants defined in the Mermaid source are added to the active phase in order
- **THEN** messages defined in the Mermaid source are added to the active phase in order
- **THEN** the diagram re-renders showing the newly imported elements

#### Scenario: Import into non-base phase
- **WHEN** user has a non-base phase active (e.g., Phase 1) and imports Mermaid syntax
- **THEN** participants and messages are appended to that phase's additions (not the base)
- **THEN** the resolved view for that phase shows base elements plus newly imported elements

#### Scenario: Invalid or non-sequence Mermaid syntax
- **WHEN** user pastes Mermaid syntax that is not a `sequenceDiagram` (e.g., flowchart)
- **THEN** the system SHALL display an error message in the dialog
- **THEN** no participants or messages are added

#### Scenario: Empty input
- **WHEN** user submits the dialog with an empty textarea
- **THEN** the system SHALL display a validation error
- **THEN** no changes are made to the diagram

#### Scenario: Sequence diagram with actor keyword
- **WHEN** user pastes a `sequenceDiagram` using `actor Alice` instead of `participant Alice`
- **THEN** Alice is imported as a participant

#### Scenario: Sequence diagram with comment lines
- **WHEN** user pastes a `sequenceDiagram` containing `%% comment` lines
- **THEN** the comment lines are ignored and do not produce participants or messages
