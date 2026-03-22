## ADDED Requirements

### Requirement: User can add a new phase to a diagram
The system SHALL provide a phase editor control in the diagram canvas toolbar that lets the user append a new phase to the diagram's phase list. The new phase SHALL receive a generated stable ID and a default label ("Phase N" where N is the new phase count). The new phase tab SHALL appear immediately in the `PhaseSwitcher`.

#### Scenario: Add phase button appends new phase
- **WHEN** the user clicks "Add Phase" in the phase editor
- **THEN** a new phase with a generated ID and default label is appended to `diagram.phaseOrder`
- **THEN** a new tab appears at the end of `PhaseSwitcher` with the default label

#### Scenario: After adding, new phase label input receives focus
- **WHEN** a new phase is added via the phase editor
- **THEN** the inline label input for the new phase is focused so the user can immediately rename it

### Requirement: User can rename a phase
The system SHALL allow the user to rename any phase (including the base phase) by editing an inline label input in the phase editor. The updated label SHALL be reflected immediately in the `PhaseSwitcher` tabs.

#### Scenario: Phase label updates in switcher
- **WHEN** the user changes a phase's label in the phase editor input
- **THEN** the corresponding `PhaseSwitcher` tab updates to show the new label

### Requirement: User can delete a non-base phase
The system SHALL allow the user to delete any phase except the first (base) phase. Deleting a phase SHALL remove it from `diagram.phaseOrder` and remove its associated data from `diagram.phases`. The base phase SHALL be protected and SHALL NOT have a delete button.

#### Scenario: Delete button absent on base phase
- **WHEN** the phase editor lists the phases
- **THEN** the first phase shows a lock icon and no delete button

#### Scenario: Deleting a phase removes its tab
- **WHEN** the user clicks the delete icon on a non-base phase
- **THEN** that phase is removed from `diagram.phaseOrder` and its `PhaseSwitcher` tab disappears

#### Scenario: Deleting the active phase resets to first phase
- **WHEN** the currently active phase is deleted
- **THEN** the active phase resets to the first phase in the diagram's phase list
