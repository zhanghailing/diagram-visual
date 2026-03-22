### Requirement: Node positions are persisted per diagram per phase
The system SHALL store node positions in the zustand store keyed by diagram ID and phase ID, and SHALL persist them as part of the project state so they survive page reload.

#### Scenario: User repositions a node and reloads
- **WHEN** the user drags a node to a new position and then reloads the page
- **THEN** the node appears at the position it was moved to, not the original auto-layout position

#### Scenario: Positions are independent per phase
- **WHEN** the user moves a node in "Phase 1" view
- **THEN** the node position in "as-is" view is unchanged

### Requirement: Positions are included in project export/import
The system SHALL include all node positions in the project JSON export and SHALL restore them on project import.

#### Scenario: User exports and re-imports a project
- **WHEN** the user exports the project to JSON and imports it in a new session
- **THEN** all diagram node positions are restored to the exported values

### Requirement: Auto-layout does not overwrite manually set positions
The system SHALL track whether a node's position was manually set by the user. Auto-layout (e.g., on Mermaid import or "Re-layout" action) SHALL only apply to nodes without a manually set position, unless the user explicitly triggers a full re-layout.

#### Scenario: Partial re-layout preserves manual positions
- **WHEN** a new node is added via Mermaid import while existing nodes have manual positions
- **THEN** only the new node receives auto-layout placement; existing manually positioned nodes do not move

#### Scenario: User triggers full re-layout
- **WHEN** the user clicks "Re-layout All" in the canvas toolbar
- **THEN** all nodes are repositioned by dagre and all manual position flags are cleared
