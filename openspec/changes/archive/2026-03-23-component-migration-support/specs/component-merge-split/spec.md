## ADDED Requirements

### Requirement: Define a structural merge step
The system SHALL allow users to add a `structural-merge` step to a migration plan. A structural-merge step declares two or more source component IDs that will be retired and exactly one successor component that will be created at the point of the merge. The successor component definition (name, type, states) is provided inline when authoring the step.

#### Scenario: Add a structural merge step
- **WHEN** the user selects "Add Structural Merge" in the plan editor, selects two or more existing components as sources, and provides a successor component definition
- **THEN** the step is appended to the plan with type `structural-merge`, listing the source component IDs and the inline successor component definition

#### Scenario: At least two source components required
- **WHEN** the user attempts to save a structural-merge step with fewer than two source components selected
- **THEN** the system SHALL display a validation error and prevent saving

#### Scenario: Successor component name must be unique
- **WHEN** the user provides a successor component name that already exists in the registry
- **THEN** the system SHALL display a validation error indicating the name is taken

### Requirement: Define a structural split step
The system SHALL allow users to add a `structural-split` step to a migration plan. A structural-split step declares exactly one source component that will be retired and two or more successor components that will be created. Each successor component definition is provided inline.

#### Scenario: Add a structural split step
- **WHEN** the user selects "Add Structural Split" in the plan editor, selects one existing component as the source, and provides two or more successor component definitions
- **THEN** the step is appended to the plan with type `structural-split`, listing the source component ID and the inline successor component definitions

#### Scenario: At least two successor components required for split
- **WHEN** the user attempts to save a structural-split step with fewer than two successor components defined
- **THEN** the system SHALL display a validation error and prevent saving

### Requirement: Successor components become available in subsequent steps
After a structural step, the system SHALL make the successor component(s) available for use in all subsequent steps of the same plan (as sources of transitions, dependency targets, and further structural steps).

#### Scenario: Use successor in a later step
- **WHEN** a structural-merge step at position N creates a successor component named "gateway"
- **THEN** plan steps at positions N+1 and beyond can reference "gateway" as a component in state-transition steps

#### Scenario: Retired components unavailable after structural step
- **WHEN** a structural-merge step at position N retires source components
- **THEN** the plan editor SHALL prevent adding state-transition steps referencing those retired components at positions N+1 or beyond

### Requirement: Successor components auto-registered as migration-created entries
The system SHALL automatically add successor components defined in structural steps to the component registry, marked as `migration-created`. These entries are read-only in the registry (they cannot be edited or deleted directly; they are owned by the structural step).

#### Scenario: Successor appears in registry after plan save
- **WHEN** the user saves a plan containing a structural-merge step with a successor component "gateway"
- **THEN** the component registry shows "gateway" with a `migration-created` badge linking to the structural step that created it

#### Scenario: Deleting the structural step removes the migration-created component
- **WHEN** the user deletes a structural step from the plan
- **THEN** the system SHALL remove the corresponding `migration-created` component(s) from the registry, provided they are not referenced by any other step

### Requirement: Persist structural steps in project file
The system SHALL include all structural step definitions (including inline successor component definitions) in the exported project JSON file.

#### Scenario: Export and reimport structural steps
- **WHEN** the user exports and reimports a project containing structural merge or split steps
- **THEN** all structural steps, their source component IDs, and their successor component definitions SHALL be fully restored
