## MODIFIED Requirements

### Requirement: Visualise the dependency graph
The system SHALL render all components and their dependency edges as an interactive directed graph. Components are nodes; edges are directed arrows labelled with the relevant states. When a migration plan step is selected, the graph SHALL update to reflect the topology at that point in the plan: components retired by structural steps at or before the selected step SHALL be rendered in a visually distinct retired style, and successor components introduced by structural steps SHALL appear as new nodes.

#### Scenario: Render graph on project load
- **WHEN** a project with components and dependency edges is loaded
- **THEN** all components appear as nodes and all edges appear as labelled directed arrows

#### Scenario: Pan and zoom
- **WHEN** the user pans or zooms the dependency graph view
- **THEN** the graph repositions or scales smoothly without loss of information

#### Scenario: Edge labels show state names
- **WHEN** a dependency edge is rendered
- **THEN** the edge label SHALL display both the source state and the target state names

#### Scenario: Retired component rendered distinctly
- **WHEN** the user has selected a plan step at or after a structural step that retired component X
- **THEN** component X is rendered in a greyed-out or crossed-out style to indicate it no longer exists at that point in the plan

#### Scenario: Successor component appears after structural step
- **WHEN** the user has selected a plan step at or after a structural step that introduced successor component Y
- **THEN** component Y appears as a new node in the graph

## ADDED Requirements

### Requirement: Topology-aware edge display per plan step
When a plan step is selected in the timeline, the dependency graph SHALL resolve all edges accounting for component retirements and successor introductions up to that step. Edges that previously targeted a now-retired component SHALL be shown as redirected to the successor component, with a visual annotation indicating the redirection.

#### Scenario: Redirected edge shown after merge
- **WHEN** a structural-merge step has retired components A and B and introduced successor C, and the user selects a step after the merge
- **THEN** any dependency edges that previously terminated at A or B are shown as terminating at C, with a visual indicator (e.g., a dashed line or annotation) that the edge was redirected

#### Scenario: No redirect annotation before structural step
- **WHEN** the user selects a step before the structural-merge step
- **THEN** dependency edges are shown pointing to their original targets (A and B) with no redirect annotation
