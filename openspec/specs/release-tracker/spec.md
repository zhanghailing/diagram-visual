### Requirement: Mark a component state transition as implemented
The system SHALL allow users to mark a specific component state transition (fromState → toState) as "implemented", indicating that the change has been coded but not yet deployed.

#### Scenario: Mark transition as implemented
- **WHEN** the user marks a component's state transition as implemented
- **THEN** the transition is stored with status "implemented" and reflected in all plan and timeline views

### Requirement: Mark a component state transition as released
The system SHALL allow users to mark a specific component state transition as "released", indicating that the change has been deployed to production and the component is now in the new state.

#### Scenario: Mark transition as released
- **WHEN** the user marks a component's state transition as released
- **THEN** the transition status is updated to "released" and the component's current live state is updated accordingly in all views

#### Scenario: Released implies implemented
- **WHEN** a transition is marked as released
- **THEN** it SHALL also be considered implemented (released is a superset of implemented)

### Requirement: Visual indicator of release status in timeline
The system SHALL show release status (unreleased, implemented, released) on plan timeline cells for transitions that have been tracked.

#### Scenario: Released step shown with distinct style
- **WHEN** a step in the timeline corresponds to a transition marked as released
- **THEN** the cell is rendered with a distinct visual indicator (e.g., filled/solid colour or checkmark icon)

#### Scenario: Implemented but not released step shown distinctly
- **WHEN** a step is marked as implemented but not yet released
- **THEN** the cell is rendered with a different indicator (e.g., partial fill or clock icon)

### Requirement: Live state view
The system SHALL provide a summary view showing each component's current live state based on all "released" transitions, giving a snapshot of what is actually deployed today.

#### Scenario: Live state summary
- **WHEN** the user opens the live state view
- **THEN** each component is shown with its current effective state (derived from all released transitions)

### Requirement: Persist release tracking in project file
The system SHALL include release tracking data in the exported project JSON file.

#### Scenario: Export and reimport release data
- **WHEN** the user exports and reimports the project
- **THEN** all implemented/released transition statuses SHALL be fully restored
