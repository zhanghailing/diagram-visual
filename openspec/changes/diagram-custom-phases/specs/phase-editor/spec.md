## ADDED Requirements

### Requirement: User can add a new phase to a diagram
The system SHALL allow users to append a new phase to the end of a diagram's phase list. The new phase inherits all elements visible in the last existing phase and starts with no overrides.

#### Scenario: User adds a phase
- **WHEN** the user opens the phase editor and clicks "Add Phase"
- **THEN** a new phase with a default label (e.g., "Phase 3") is appended to the diagram's phase list and becomes immediately selectable in the phase switcher

#### Scenario: New phase label is editable immediately
- **WHEN** a new phase is added
- **THEN** the phase editor focuses the label input for the new phase so the user can rename it inline

### Requirement: User can rename any phase
The system SHALL allow users to rename any phase by editing its label. Renaming does not change the phase's ID or invalidate any override data.

#### Scenario: User renames a phase
- **WHEN** the user edits the label field for a phase in the phase editor and confirms
- **THEN** the phase switcher tab updates to show the new label and all existing override data for that phase is preserved

#### Scenario: Rename is reflected in PhaseSwitcher immediately
- **WHEN** the user changes a phase label
- **THEN** the PhaseSwitcher tab for that phase shows the updated label without requiring a page reload

### Requirement: User can delete a non-base phase
The system SHALL allow users to delete any phase except the first (base) phase. Deleting a phase removes its override data from the diagram.

#### Scenario: User deletes a phase
- **WHEN** the user clicks the delete button for a non-base phase in the phase editor
- **THEN** the phase is removed from the phase list, its override data is discarded, and the phase switcher no longer shows it

#### Scenario: Base phase cannot be deleted
- **WHEN** the user views the phase editor
- **THEN** the delete button for the first phase is disabled or absent, and a tooltip explains it is the base phase

#### Scenario: Active phase is deleted
- **WHEN** the currently active phase is deleted by the user
- **THEN** the canvas switches to the first (base) phase automatically

### Requirement: Phase editor is accessible from the diagram toolbar
The system SHALL provide a phase editor control on the canvas and sequence diagram toolbars, adjacent to the PhaseSwitcher.

#### Scenario: User opens phase editor
- **WHEN** the user clicks the phase editor button in the toolbar
- **THEN** a popover or panel opens listing all phases with rename and delete controls and an "Add Phase" button
