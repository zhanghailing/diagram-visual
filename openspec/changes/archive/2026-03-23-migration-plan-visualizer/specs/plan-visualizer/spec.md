## ADDED Requirements

### Requirement: Render a migration plan as a timeline
The system SHALL render a selected migration plan as a horizontal timeline where each column represents a step and each row represents a component. Cells show the component's state at that step; transitions are highlighted in the cell where they occur.

#### Scenario: Timeline renders on plan selection
- **WHEN** the user selects a plan from the plan list
- **THEN** the timeline renders with one column per step and one row per component that appears in the plan

#### Scenario: Current state visible at each step
- **WHEN** the timeline is rendered
- **THEN** each cell shows the component's effective state at that step (the state it entered at the most recent transition up to and including this step)

#### Scenario: Transition highlighted
- **WHEN** a component transitions state at step N
- **THEN** the cell at (component, step N) is visually highlighted to indicate a transition occurred, with fromState and toState shown

### Requirement: Colour-code feasibility in the timeline
The system SHALL colour-code each step cell in the timeline to indicate its feasibility status: normal (no issue), violation (dependency unmet), or unvalidated (preceded by a violation).

#### Scenario: Violation cell coloured red
- **WHEN** a plan step is a feasibility violation
- **THEN** the corresponding timeline cell SHALL be rendered in red (or equivalent high-visibility error colour)

#### Scenario: Unvalidated steps are visually subdued
- **WHEN** steps follow a violation in the plan
- **THEN** they SHALL be rendered in a subdued style (e.g., grey or muted) to indicate they have not been validated

### Requirement: Step detail panel
The system SHALL show a detail panel when the user clicks a step in the timeline, displaying the step's component, fromState, toState, notes, feasibility status, and violation reason (if any).

#### Scenario: Click step shows detail panel
- **WHEN** the user clicks a step cell in the timeline
- **THEN** a side panel or tooltip shows all step details including any violation reason

### Requirement: Component-filtered view
The system SHALL allow users to filter the timeline to show only selected components, reducing visual noise for large projects.

#### Scenario: Filter components in timeline
- **WHEN** the user selects a subset of components to display
- **THEN** the timeline shows only rows for those components, other rows are hidden

### Requirement: Render the dependency graph alongside the plan
The system SHALL provide a view that shows the dependency graph and the plan timeline side by side, allowing users to see which constraints affect each step.

#### Scenario: Side-by-side dependency and timeline view
- **WHEN** the user activates the combined view mode
- **THEN** the dependency graph is rendered on one side and the timeline on the other, with the active plan loaded
