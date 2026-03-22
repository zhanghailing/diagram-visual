## ADDED Requirements

### Requirement: Define a component
The system SHALL allow users to create a component with a unique ID, a human-readable name, a type (one of: frontend, backend, library, gateway, platform, other), and an ordered list of named states representing its migration lifecycle.

#### Scenario: Create a new component
- **WHEN** the user submits a component creation form with a name, type, and at least two states
- **THEN** the component is added to the project registry and appears in the component list

#### Scenario: Require at least two states
- **WHEN** the user attempts to save a component with fewer than two states
- **THEN** the system SHALL display a validation error and prevent saving

#### Scenario: Unique component names
- **WHEN** the user enters a component name that already exists in the project
- **THEN** the system SHALL display a validation error indicating the name is taken

### Requirement: Edit a component
The system SHALL allow users to rename a component, change its type, add states, reorder states, and rename states after creation.

#### Scenario: Rename a component
- **WHEN** the user changes a component's name and saves
- **THEN** all references to the component in plans and dependencies SHALL remain intact

#### Scenario: Add a state to a component
- **WHEN** the user adds a new state to an existing component
- **THEN** the new state is appended to the component's state list and available for use in dependency edges and plan steps

#### Scenario: Reorder states
- **WHEN** the user drags a state to a new position in the ordered list
- **THEN** the state order is updated, and any existing plan steps referencing these states remain valid

### Requirement: Delete a component
The system SHALL allow users to delete a component from the registry. Deletion SHALL be blocked if the component is referenced in any plan or dependency edge.

#### Scenario: Delete an unreferenced component
- **WHEN** the user deletes a component that has no plan steps or dependency edges referencing it
- **THEN** the component is removed from the registry

#### Scenario: Block deletion of referenced component
- **WHEN** the user attempts to delete a component that is referenced in at least one plan step or dependency edge
- **THEN** the system SHALL display an error listing the referencing plans and dependencies, and prevent deletion

### Requirement: Component type taxonomy
The system SHALL support the following component types: frontend, backend, library, gateway, platform, other.

#### Scenario: Select component type during creation
- **WHEN** the user creates a component and selects a type from the supported taxonomy
- **THEN** the component is stored with that type and the type is shown in all component views

### Requirement: Persist component registry in project file
The system SHALL include all component definitions in the exported project JSON file.

#### Scenario: Export and reimport component data
- **WHEN** the user exports the project to a JSON file and then imports it in a new session
- **THEN** all components, their types, and their state definitions SHALL be fully restored
