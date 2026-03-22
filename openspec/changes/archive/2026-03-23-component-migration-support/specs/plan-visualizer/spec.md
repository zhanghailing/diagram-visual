## MODIFIED Requirements

### Requirement: Render a migration plan as a timeline
The system SHALL render a selected migration plan as a horizontal timeline where each column represents a step and each row represents a component. Cells show the component's state at that step; transitions are highlighted in the cell where they occur. Structural steps (merge or split) SHALL be rendered as distinct column types showing the topology change rather than a single state transition.

#### Scenario: Timeline renders on plan selection
- **WHEN** the user selects a plan from the plan list
- **THEN** the timeline renders with one column per step and one row per component that appears in the plan (including successor components introduced by structural steps)

#### Scenario: Current state visible at each step
- **WHEN** the timeline is rendered
- **THEN** each cell shows the component's effective state at that step (the state it entered at the most recent transition up to and including this step)

#### Scenario: Transition highlighted
- **WHEN** a component transitions state at step N
- **THEN** the cell at (component row, step N) is visually highlighted to indicate a transition occurred, with fromState and toState shown

#### Scenario: Structural step column rendered distinctly
- **WHEN** the timeline renders a structural-merge or structural-split step column
- **THEN** the column is rendered with a distinct visual style (e.g., a funnel or fan-out icon, different background) that clearly distinguishes it from state-transition step columns

#### Scenario: Retiring component row ends at structural step
- **WHEN** a component is retired by a structural step at column N
- **THEN** the component's row terminates at column N with a visual end-cap (e.g., a strikethrough or fade-out) and no cells are rendered for that row in columns N+1 and beyond

#### Scenario: Successor component row begins at structural step
- **WHEN** a structural step at column N introduces a successor component
- **THEN** the successor component's row begins at column N and extends to all subsequent columns

## ADDED Requirements

### Requirement: Structural step detail panel
The system SHALL show a detail panel when the user clicks a structural step column in the timeline, displaying the step type (merge or split), the list of source components being retired, the successor component(s) being created, and the step's notes and feasibility status.

#### Scenario: Click structural step shows detail panel
- **WHEN** the user clicks a structural step column in the timeline
- **THEN** a side panel or tooltip shows: step type, source component names, successor component name(s), notes, and any retirement constraint violation reasons

### Requirement: Merge animation between topology states
When the user navigates between steps in the timeline, if the transition crosses a structural step boundary, the dependency graph view SHALL animate the topology change (source nodes converging into successor for merge; source node fanning out for split).

#### Scenario: Merge transition animation plays
- **WHEN** the user advances the selected step from the step before a structural-merge to the step at or after it
- **THEN** the dependency graph animates the source component nodes converging into the successor node

#### Scenario: Split transition animation plays
- **WHEN** the user advances the selected step from the step before a structural-split to the step at or after it
- **THEN** the dependency graph animates the source component node fanning out into the successor nodes
