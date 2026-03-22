### Requirement: Diagrams support multiple phases
The system SHALL associate each diagram with a user-defined ordered list of phases stored as `phaseOrder: DiagramPhase[]` on the diagram, where each `DiagramPhase` has a stable `id: string` and a mutable `label: string`. The first phase in the list is the base phase. Elements defined in earlier phases are inherited by later phases unless explicitly overridden. The system SHALL support any number of phases (minimum 1).

#### Scenario: User switches to a later phase
- **WHEN** the user selects any phase from the phase switcher
- **THEN** all elements from all preceding phases are shown (inheritance chain), plus elements added in the selected phase, minus elements hidden in any phase up to and including the selected phase

#### Scenario: Element added in a later phase is not visible in earlier phases
- **WHEN** a node is marked as added in phase N
- **THEN** it does NOT appear when the user views any phase before phase N

#### Scenario: Diagram with no phaseOrder falls back to default phases
- **WHEN** a diagram is loaded that has no `phaseOrder` field (legacy data)
- **THEN** the system treats it as having three phases: `{id: 'as-is', label: 'As-Is'}`, `{id: 'phase-1', label: 'Phase 1'}`, `{id: 'phase-2', label: 'Phase 2'}`, preserving all existing override data

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

### Requirement: Phase switcher renders from diagram's phase list
The system SHALL render one tab per phase in `diagram.phaseOrder` (or the default fallback), in order. The number of tabs is dynamic and updates immediately when phases are added or removed.

#### Scenario: PhaseSwitcher reflects diagram phases
- **WHEN** a diagram has 5 phases
- **THEN** the PhaseSwitcher shows exactly 5 tabs with the correct labels in order

#### Scenario: PhaseSwitcher updates after phase added
- **WHEN** a new phase is added to the diagram
- **THEN** a new tab appears at the end of the PhaseSwitcher immediately

### Requirement: Phase diff uses diagram's phase list
The system SHALL populate the from/to selectors in `PhaseDiffView` from the diagram's actual phase list, not a hardcoded constant.

#### Scenario: PhaseDiffView shows all phases
- **WHEN** a diagram has 4 phases and the user opens the phase diff view
- **THEN** both the from and to selectors show all 4 phases by name
