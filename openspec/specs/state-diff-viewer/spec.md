### Requirement: View before/after state of a component at a plan step
The system SHALL allow users to select any step in a plan and view a before/after comparison of the affected component's state, including all relevant metadata (state name, description, and any notes attached to the step).

#### Scenario: Open diff for a step
- **WHEN** the user selects a step and opens the diff view
- **THEN** the view shows two panels: the component's state before the transition and after the transition

#### Scenario: State name highlighted as changed
- **WHEN** the diff view is rendered for a transition
- **THEN** the state name change (fromState → toState) SHALL be visually prominent

### Requirement: Compare a component's state between two plans at the same step index
The system SHALL allow users to select a component and a step index and compare what state that component is in across two different plans at that point in time.

#### Scenario: Cross-plan state comparison for a component
- **WHEN** the user selects a component and a step index in plan comparison mode
- **THEN** the diff viewer shows the component's effective state in Plan A vs Plan B at that step

### Requirement: Show full component state context in diff
The system SHALL show the full state context in both panels of the diff: state name, all active dependency edges involving this component at this state, and any release status.

#### Scenario: Dependency context shown in diff
- **WHEN** the diff view is open for a component transition
- **THEN** both panels list the dependency edges relevant to the before and after states, so the user can see how constraints change

### Requirement: Highlight added and removed dependency constraints
When a component transitions between states, the system SHALL highlight in the diff which dependency constraints are newly applicable in the new state and which constraints from the old state no longer apply.

#### Scenario: New constraint highlighted as added
- **WHEN** a transition activates a new dependency edge
- **THEN** the diff shows the new edge highlighted in green (or equivalent "added" colour)

#### Scenario: Removed constraint highlighted as removed
- **WHEN** a transition deactivates a dependency edge that applied in the old state
- **THEN** the diff shows the removed edge highlighted in red (or equivalent "removed" colour)

### Requirement: Diff accessible from timeline cell
The system SHALL make the before/after diff accessible directly from any transition cell in the plan timeline view, without requiring navigation to a separate page.

#### Scenario: Open diff from timeline
- **WHEN** the user right-clicks or clicks a detail action on a transition cell in the timeline
- **THEN** the diff view opens for that step, showing the before/after state of the transitioning component
