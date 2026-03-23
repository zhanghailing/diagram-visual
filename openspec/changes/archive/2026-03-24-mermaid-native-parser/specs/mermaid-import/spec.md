## MODIFIED Requirements

### Requirement: Unsupported Mermaid syntax shows a clear error
The system SHALL display a descriptive error message when the pasted Mermaid syntax is unsupported, invalid, or fails to parse via the Mermaid AST parser, without creating a partial diagram. Parse errors from the underlying Mermaid parser SHALL be forwarded to the user.

#### Scenario: User imports unsupported Mermaid syntax
- **WHEN** the user pastes Mermaid syntax for an unsupported type (e.g., `gantt`, `pie`)
- **THEN** the import dialog displays an error message stating the type is not supported and no diagram is created

#### Scenario: User imports malformed Mermaid syntax
- **WHEN** the user pastes syntactically invalid Mermaid text
- **THEN** the import dialog displays a parse error message from the Mermaid AST parser with details where possible

#### Scenario: Parse error does not create a partial diagram
- **WHEN** a parse error occurs mid-way through a large flowchart
- **THEN** no nodes or edges are added to the canvas
