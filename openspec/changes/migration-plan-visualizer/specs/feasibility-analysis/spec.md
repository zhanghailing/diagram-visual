## ADDED Requirements

### Requirement: Simulate plan execution to validate feasibility
The system SHALL validate a migration plan by simulating each step in order. Before applying a step, the system SHALL check that all dependency preconditions for the target component's transition are satisfied by the current simulated state of all components. If a precondition is not met, the step is marked as a violation.

#### Scenario: Valid plan passes simulation
- **WHEN** a plan's steps satisfy all dependency constraints in execution order
- **THEN** the plan is marked as feasible and no violations are shown

#### Scenario: Invalid step detected
- **WHEN** a plan step would transition a component to a state whose dependency preconditions are not yet satisfied
- **THEN** the step is marked as a violation with a reason explaining which dependency is unsatisfied

### Requirement: Display violations with reasons
For each violated step, the system SHALL display a human-readable explanation identifying which dependency edge is violated and what state the blocking component needs to be in.

#### Scenario: Violation reason shown inline
- **WHEN** a plan contains a violation on step N
- **THEN** step N in the plan view SHALL show an inline error: "Requires [component] to be in state [state] before this step"

#### Scenario: Violation summary at plan level
- **WHEN** a plan has one or more violations
- **THEN** the plan header SHALL display a summary badge or count of violations

### Requirement: Live re-evaluation on plan edit
The system SHALL re-run feasibility analysis automatically whenever the plan steps are modified (added, removed, reordered) or when dependency edges change.

#### Scenario: Reorder step resolves violation
- **WHEN** the user moves a blocked step to after the step that satisfies its precondition
- **THEN** the violation is immediately cleared without requiring a manual re-check

#### Scenario: New dependency edge creates violation
- **WHEN** the user adds a dependency edge that a currently-passing plan step does not satisfy
- **THEN** the plan's feasibility view immediately updates to show the new violation

### Requirement: Infeasible plan visual indicator
The system SHALL visually distinguish feasible plans from infeasible plans in all list and comparison views.

#### Scenario: Plan list shows feasibility status
- **WHEN** the plan list is rendered
- **THEN** each plan SHALL show a visual indicator (e.g., green check / red cross) indicating whether it is currently feasible

### Requirement: Partial feasibility — identify the first blocking step
When a plan is infeasible, the system SHALL identify the first step that causes a violation and clearly mark all subsequent steps as "blocked" or "unvalidated" since they depend on a failed predecessor.

#### Scenario: Cascade marking after first violation
- **WHEN** step 3 in a plan is the first violation
- **THEN** steps 4 and beyond SHALL be visually marked as unvalidated/dependent on the violation being resolved
