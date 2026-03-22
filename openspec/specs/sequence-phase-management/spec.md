### Requirement: User can add a phase in sequence diagram
The sequence diagram toolbar SHALL include a phase editor control (gear icon) that opens a popover allowing the user to add a new phase to the diagram.

#### Scenario: Add phase from toolbar
- **WHEN** user clicks the gear icon in the sequence diagram toolbar
- **THEN** a popover opens showing the current phases and an "Add Phase" button

#### Scenario: New phase appears in phase switcher
- **WHEN** user clicks "Add Phase" in the phase editor popover
- **THEN** a new phase is appended to the phase list with a default label and becomes selectable in the `PhaseSwitcher`

### Requirement: User can rename a phase in sequence diagram
The sequence diagram phase editor popover SHALL allow the user to rename any non-base phase by editing its label inline.

#### Scenario: Rename phase via input
- **WHEN** user edits the label input for a non-base phase and blurs the field
- **THEN** the phase label is updated in the store and reflected in `PhaseSwitcher`

#### Scenario: Base phase is not renameable
- **WHEN** the phase editor popover is open
- **THEN** the first (base) phase shows a lock icon and its input is read-only

### Requirement: User can delete a phase in sequence diagram
The sequence diagram phase editor popover SHALL allow the user to delete any non-base phase. Deleting a phase also removes its associated sequence phase state.

#### Scenario: Delete non-base phase
- **WHEN** user clicks the delete (trash) button for a non-base phase
- **THEN** the phase is removed from `phaseOrder` and its data is removed from `sequencePhases`

#### Scenario: Base phase cannot be deleted
- **WHEN** the phase editor popover is open
- **THEN** the first (base) phase has no delete button

### Requirement: User can reorder phases in sequence diagram
The sequence diagram phase editor popover SHALL allow the user to move non-base phases up or down using arrow controls.

#### Scenario: Move phase up
- **WHEN** user clicks the "Move up" button on a non-base phase that is not immediately after the base phase
- **THEN** the phase moves one position earlier in `phaseOrder`

#### Scenario: Move phase down
- **WHEN** user clicks the "Move down" button on a non-base phase that is not the last phase
- **THEN** the phase moves one position later in `phaseOrder`

#### Scenario: Boundary buttons are disabled
- **WHEN** a non-base phase is at the earliest allowed position (index 1)
- **THEN** its "Move up" button is disabled

#### Scenario: Last phase move-down is disabled
- **WHEN** a non-base phase is the last phase in the list
- **THEN** its "Move down" button is disabled
