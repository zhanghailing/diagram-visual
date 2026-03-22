## MODIFIED Requirements

### Requirement: Delete a component
The system SHALL allow users to delete a component from the registry. Deletion SHALL be blocked if the component is referenced in any plan or dependency edge. Deletion SHALL also be blocked if the component is marked as `migration-created` (it is owned by a structural step and must be removed by deleting that step).

#### Scenario: Delete an unreferenced component
- **WHEN** the user deletes a component that has no plan steps or dependency edges referencing it
- **THEN** the component is removed from the registry

#### Scenario: Block deletion of referenced component
- **WHEN** the user attempts to delete a component that is referenced in at least one plan step or dependency edge
- **THEN** the system SHALL display an error listing the referencing plans and dependencies, and prevent deletion

#### Scenario: Block deletion of migration-created component
- **WHEN** the user attempts to delete a component that is marked as `migration-created`
- **THEN** the system SHALL display an error explaining that the component is owned by a structural step and can only be removed by deleting that step

## ADDED Requirements

### Requirement: Component lifecycle status
The system SHALL track a computed lifecycle status for each component within the context of a migration plan simulation: `active`, `retiring`, or `retired`. This status is derived from the plan simulation and is not stored as a field on the component in the registry.

- `active`: the component exists and has not been retired by any structural step up to the current simulation point
- `retiring`: the component is declared as a source in a structural step that has not yet been reached in the simulation
- `retired`: the component has been retired by a structural step that has already been simulated

#### Scenario: Active status before structural step
- **WHEN** the plan is simulated and has not yet reached the structural step that retires component X
- **THEN** component X has lifecycle status `active`

#### Scenario: Retiring status at the structural step
- **WHEN** the plan simulation is at the structural step that declares component X as a source
- **THEN** component X has lifecycle status `retiring` during that step

#### Scenario: Retired status after structural step
- **WHEN** the plan simulation has passed the structural step that retired component X
- **THEN** component X has lifecycle status `retired` and is no longer available for new steps

### Requirement: Migration-created component marker
The system SHALL mark components that originate from a structural step as `migration-created`. These components SHALL be displayed in the registry with a visual badge and a link to the structural step that created them. Their definition fields (name, type, states) SHALL be read-only in the registry UI.

#### Scenario: Migration-created badge shown in registry
- **WHEN** the component registry is displayed and a component was created by a structural step
- **THEN** the component entry shows a `migration-created` badge and a link to the originating structural step

#### Scenario: Edit blocked for migration-created component
- **WHEN** the user attempts to edit a `migration-created` component's name, type, or states via the registry UI
- **THEN** the system SHALL display a message explaining the component is managed by a structural step and redirect the user to that step
