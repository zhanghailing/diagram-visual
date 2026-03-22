## ADDED Requirements

### Requirement: Copy resolved phase as Mermaid code
The system SHALL allow a user to copy the Mermaid flowchart representation of the currently resolved phase to the clipboard.

#### Scenario: Copy Mermaid code to clipboard
- **WHEN** the user clicks "Copy Mermaid" from the export menu in the Diagram Canvas toolbar
- **THEN** the system SHALL generate `flowchart LR` Mermaid syntax from the resolved phase nodes and edges and write it to the clipboard

#### Scenario: Mermaid output uses safe node IDs
- **WHEN** Mermaid code is generated
- **THEN** each node SHALL be represented as `<safeId>[<label>]` where `safeId` is the node's internal UUID with hyphens removed (to comply with Mermaid ID rules)

#### Scenario: Node labels are escaped
- **WHEN** a node label contains characters that would break Mermaid syntax (quotes, square brackets)
- **THEN** those characters SHALL be escaped or stripped before output

#### Scenario: Edges include optional labels
- **WHEN** an edge has a non-empty label
- **THEN** the Mermaid output SHALL include it as `source -->|label| target`
- **WHEN** an edge has no label
- **THEN** the Mermaid output SHALL use `source --> target`

#### Scenario: Copy confirmation
- **WHEN** the Mermaid code is successfully written to the clipboard
- **THEN** the button SHALL briefly show a "Copied!" confirmation state
