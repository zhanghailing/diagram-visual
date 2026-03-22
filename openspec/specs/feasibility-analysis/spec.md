### Requirement: Simulate plan execution to validate feasibility
The system SHALL validate a migration plan by simulating each step in order. Before applying a step, the system SHALL check that all dependency preconditions for the target component's transition are satisfied by the current simulated state of all components. For structural steps, the system SHALL additionally apply retirement constraint checks (see retirement constraint requirements below). If any precondition is not met, the step is marked as a violation.

#### Scenario: Valid plan passes simulation
- **WHEN** a plan's steps satisfy all dependency constraints in execution order
- **THEN** the plan is marked as feasible and no violations are shown

#### Scenario: Invalid step detected
- **WHEN** a plan step would transition a component to a state whose dependency preconditions are not yet satisfied
- **THEN** the step is marked as a violation with a reason explaining which dependency is unsatisfied

#### Scenario: Valid structural step passes simulation
- **WHEN** a structural-merge or structural-split step has no dependents on the retiring components that occur after the structural step
- **THEN** the structural step passes the retirement constraint check and the simulation continues with the successor component(s) active

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

### Requirement: Retirement constraint — no post-retirement transitions
The system SHALL detect and flag as a violation any state-transition step that targets a component that has already been retired (i.e., the component was declared as a source in a structural step at an earlier position in the plan).

#### Scenario: Transition targeting retired component is a violation
- **WHEN** a state-transition step at position N targets component X, and component X was retired by a structural step at position M < N
- **THEN** step N is marked as a violation with the reason: "Component [X] has been retired at step [M] and cannot be transitioned"

### Requirement: Retirement constraint — dependents must be resolved before retirement
The system SHALL detect and flag as a violation any structural step that retires a component whose active dependents (components with dependency edges pointing to the retiring component) have not yet transitioned to use the successor component's equivalent states.

#### Scenario: Unresolved dependent before merge is a violation
- **WHEN** a structural-merge step retires component A at position N, and component B has a dependency edge on A's state that has not been satisfied (no prior step redirected B's dependency to the successor)
- **THEN** the structural step at position N is marked as a violation with the reason: "Component [B] still depends on [A] which is being retired; its dependency must be resolved before this step"

### Requirement: Edge redirection in simulation
During plan simulation, after a structural step is applied, the system SHALL update the active dependency edge set: all edges that previously referenced a retired component SHALL be treated as redirected to the successor component for the remainder of the simulation.

#### Scenario: Successor inherits dependency edges post-merge
- **WHEN** the simulation passes a structural-merge step that retired A and B and introduced successor C
- **THEN** for all subsequent steps in the simulation, feasibility checks use C's state wherever A's or B's state would previously have been required by an edge

### Requirement: Display structural violation reasons
For each violated structural step, the system SHALL display a human-readable explanation identifying whether the violation is a retirement constraint or a dependency resolution failure.

#### Scenario: Structural violation reason shown inline
- **WHEN** a structural step at position N has a retirement constraint violation
- **THEN** step N in the plan view SHALL show an inline error with the specific retirement constraint message
