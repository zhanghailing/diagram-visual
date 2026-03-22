## MODIFIED Requirements

### Requirement: Add steps to a plan
The system SHALL allow users to add steps to a plan. Steps are appended to the end of the plan by default and can be reordered. A step SHALL be one of two types:

- **State-transition step**: selects a component, a fromState, and a toState. Only components that are `active` at the position the step is being inserted are selectable.
- **Structural step**: either a `structural-merge` (selecting 2+ active source components and defining a successor) or a `structural-split` (selecting 1 active source component and defining 2+ successors). See the `component-merge-split` spec for full structural step requirements.

#### Scenario: Add a state-transition step
- **WHEN** the user selects a component and its fromState/toState and confirms adding the step
- **THEN** the step is appended to the plan's step list

#### Scenario: FromState and toState must differ
- **WHEN** the user selects the same state for both fromState and toState
- **THEN** the system SHALL display a validation error

#### Scenario: Reorder steps via drag-and-drop
- **WHEN** the user drags a step to a new position in the plan
- **THEN** the step order is updated and the feasibility analysis for the plan is re-evaluated

#### Scenario: Only active components selectable for state-transition steps
- **WHEN** the user opens the step editor at position N in a plan that contains a structural step at position M < N that retired component X
- **THEN** component X is not available in the component selector for state-transition steps at position N

#### Scenario: Add a structural merge step
- **WHEN** the user selects "Add Structural Step → Merge" in the plan editor and completes the merge definition
- **THEN** the structural-merge step is appended to the plan

### Requirement: Persist plans in project file
The system SHALL include all migration plans in the exported project JSON file. Plans containing structural steps SHALL persist all structural step data including source component IDs and inline successor component definitions.

#### Scenario: Export and reimport plan data
- **WHEN** the user exports and reimports the project
- **THEN** all plans, steps (both state-transition and structural), and step notes SHALL be fully restored
