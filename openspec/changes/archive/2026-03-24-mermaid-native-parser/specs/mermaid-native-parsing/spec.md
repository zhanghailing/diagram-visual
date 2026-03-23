## ADDED Requirements

### Requirement: Flowchart parsing uses Mermaid AST
The system SHALL parse `graph` and `flowchart` Mermaid syntax using the `@mermaid-js/parser` AST rather than regex, correctly handling all arrow types (`-->`, `--->`, `==>`, `-.->`, `--o`, `--x`), edge labels, and node shapes defined in the Mermaid grammar.

#### Scenario: Modern arrow type is imported
- **WHEN** user pastes a flowchart containing `A --o B` (circle arrow) or `A --x B` (cross arrow)
- **THEN** the edge is imported and appears on the canvas connecting A to B

#### Scenario: Edge label in bracket form is preserved
- **WHEN** user pastes `A -->|my label| B`
- **THEN** the imported edge has label "my label"

#### Scenario: Unsupported construct is skipped with warning
- **WHEN** user pastes a flowchart containing a `subgraph` block
- **THEN** the subgraph is skipped, remaining nodes and edges are imported, and a console warning is emitted

### Requirement: Sequence diagram parsing uses Mermaid AST
The system SHALL parse `sequenceDiagram` Mermaid syntax using the `@mermaid-js/parser` AST, correctly handling `participant`, `actor`, all arrow variants (`->>`, `-->>`, `->`, `-->`, `-x`, `--x`, `-)`, `--)`), and `%%` comments.

#### Scenario: Actor keyword is treated like participant
- **WHEN** user pastes `actor Alice` in a sequence diagram
- **THEN** Alice is imported as a participant

#### Scenario: Double-headed async arrow is imported
- **WHEN** user pastes `Alice -->> Bob: response`
- **THEN** the message from Alice to Bob with label "response" is imported

#### Scenario: Comment lines are ignored
- **WHEN** user pastes a sequence diagram containing `%% this is a comment`
- **THEN** the comment line is ignored and does not produce a participant or message

#### Scenario: Unsupported block constructs are skipped
- **WHEN** user pastes a sequence diagram containing `loop`, `alt`, `par`, `rect`, or `note` blocks
- **THEN** those blocks are skipped and a console warning is emitted; messages outside those blocks are still imported

### Requirement: Parse errors surface a clear message
The system SHALL catch parse errors thrown by `@mermaid-js/parser` and surface a human-readable error message in the import dialog, without creating a partial diagram.

#### Scenario: Syntax error in flowchart
- **WHEN** user pastes a `flowchart` with invalid syntax (e.g., unclosed bracket)
- **THEN** the import dialog displays "Parse error: <details>" and the confirm button is disabled

#### Scenario: Syntax error in sequence diagram
- **WHEN** user pastes a `sequenceDiagram` with invalid syntax
- **THEN** the import dialog displays a parse error message and no participants or messages are added
