## ADDED Requirements

### Requirement: Diagrams support multiple phases
The system SHALL associate each diagram with an ordered set of phases: `as-is`, `phase-1`, and `phase-2`. Elements defined in an earlier phase are inherited by later phases unless explicitly overridden.

#### Scenario: User switches to a later phase
- **WHEN** the user selects "Phase 1" from the phase switcher
- **THEN** all elements from "as-is" are shown, plus any elements added in phase 1, minus any elements hidden in phase 1

#### Scenario: Element added in phase 1 is not visible in as-is
- **WHEN** a node is marked as added in phase 1
- **THEN** it does NOT appear when the user views the as-is phase

### Requirement: Elements can be overridden per phase
The system SHALL allow per-phase overrides for each element: add (new in this phase), hide (removed in this phase), or modify label/properties.

#### Scenario: User marks a node as hidden in phase 2
- **WHEN** the user selects a node, opens its context menu, and chooses "Hide in this phase"
- **THEN** the node is no longer visible in phase 2 and is shown with a strikethrough indicator in phase 2's override list

#### Scenario: User modifies a node label for a specific phase
- **WHEN** the user edits a node label while viewing phase 1
- **THEN** the label change is saved as a phase 1 override and the as-is label is unchanged

### Requirement: Phase diff highlights changes
The system SHALL provide a read-only diff view that highlights additions, removals, and modifications between two selected phases.

#### Scenario: User views diff between as-is and phase 1
- **WHEN** the user opens the phase diff view and selects "as-is → phase 1"
- **THEN** added elements are highlighted in green, removed elements in red, and modified elements in yellow

### Requirement: Phase switcher is always visible
The system SHALL display a phase switcher control on the diagram canvas toolbar that allows switching between phases without leaving the canvas.

#### Scenario: User switches phases from the toolbar
- **WHEN** the user clicks a phase tab in the toolbar (e.g., "Phase 2")
- **THEN** the canvas updates to reflect phase 2's element set without navigating away
