## ADDED Requirements

### Requirement: Edge label backgrounds render as white in PNG export
When capturing a React Flow diagram as PNG, edge label background rectangles (`.react-flow__edge-textbg`) SHALL have their fill set to white before capture and restored to their original value after capture, so they do not appear as black blocks in the exported image.

#### Scenario: Export with edge labels present
- **WHEN** the user exports a diagram that contains edges with labels
- **THEN** the downloaded PNG shows edge label backgrounds as white (not black blocks)

#### Scenario: Inline style is restored after capture
- **WHEN** PNG capture completes (successfully or with an error)
- **THEN** the fill inline style on each `.react-flow__edge-textbg` element is restored to its pre-capture value, leaving the live diagram unchanged
