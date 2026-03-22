## ADDED Requirements

### Requirement: Phase switcher in sequence diagram toolbar
The sequence diagram view SHALL display a phase switcher control in its toolbar. The phase switcher SHALL show the currently active phase and allow the user to switch to any other phase defined on the diagram.

#### Scenario: Phase switcher is visible
- **WHEN** user opens a sequence diagram
- **THEN** the toolbar displays a phase switcher showing the current phase label

#### Scenario: Switch to a different phase
- **WHEN** user selects a different phase from the phase switcher
- **THEN** the diagram re-renders showing the resolved state for the selected phase
- **THEN** cumulative participants and messages from all prior phases are shown

#### Scenario: As-Is phase shows only base elements
- **WHEN** user selects the "As-Is" phase
- **THEN** only participants and messages defined in the base diagram are shown
- **THEN** no phase-specific additions are included

### Requirement: Phase state accumulation in sequence diagram
The sequence diagram view SHALL resolve and display participants and messages by accumulating all phases up to and including the active phase, consistent with how the architecture/C4 canvas resolves phase state.

#### Scenario: Phase 1 includes base plus Phase 1 additions
- **WHEN** Phase 1 is active and contains additional participants or messages
- **THEN** the diagram shows base participants/messages AND Phase 1 additions combined
- **THEN** hidden elements (from any phase's hide list) are not shown

#### Scenario: Active phase persists during session
- **WHEN** user switches to Phase 2 in the sequence diagram view
- **THEN** the selected phase remains active while the user stays in that diagram view
