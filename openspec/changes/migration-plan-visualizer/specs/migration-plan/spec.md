## ADDED Requirements

### Requirement: Create a migration plan
The system SHALL allow users to create a named migration plan containing an ordered list of steps. Each step represents a single component transitioning from one state to the next.

Step structure: `{ component, fromState, toState, notes? }`.

#### Scenario: Create a new plan
- **WHEN** the user provides a plan name and confirms creation
- **THEN** an empty plan is added to the project and appears in the plan list

#### Scenario: Unique plan names
- **WHEN** the user attempts to create a plan with a name identical to an existing plan
- **THEN** the system SHALL display a validation error

### Requirement: Add steps to a plan
The system SHALL allow users to add steps to a plan by selecting a component, a fromState, and a toState. Steps are appended to the end of the plan by default and can be reordered.

#### Scenario: Add a step
- **WHEN** the user selects a component and its fromState/toState and confirms adding the step
- **THEN** the step is appended to the plan's step list

#### Scenario: FromState and toState must differ
- **WHEN** the user selects the same state for both fromState and toState
- **THEN** the system SHALL display a validation error

#### Scenario: Reorder steps via drag-and-drop
- **WHEN** the user drags a step to a new position in the plan
- **THEN** the step order is updated and the feasibility analysis for the plan is re-evaluated

### Requirement: Edit and delete steps
The system SHALL allow users to edit the notes field of a step and delete individual steps from a plan.

#### Scenario: Edit step notes
- **WHEN** the user modifies the notes field of a step and saves
- **THEN** the updated notes are stored and displayed for that step

#### Scenario: Delete a step
- **WHEN** the user deletes a step from the plan
- **THEN** the step is removed and the plan's feasibility is re-evaluated

### Requirement: Delete a migration plan
The system SHALL allow users to delete an entire migration plan. Deletion is permanent and does not affect components, dependencies, or release tracking data.

#### Scenario: Delete a plan
- **WHEN** the user confirms deletion of a plan
- **THEN** the plan is removed from the project and no longer appears in any list or comparison view

### Requirement: Duplicate a migration plan
The system SHALL allow users to duplicate an existing plan as a starting point for creating an alternative plan.

#### Scenario: Duplicate a plan
- **WHEN** the user chooses to duplicate a plan
- **THEN** a new plan is created with all the same steps and a name derived from the original (e.g., "Plan A (copy)")

### Requirement: Persist plans in project file
The system SHALL include all migration plans in the exported project JSON file.

#### Scenario: Export and reimport plan data
- **WHEN** the user exports and reimports the project
- **THEN** all plans, steps, and step notes SHALL be fully restored
