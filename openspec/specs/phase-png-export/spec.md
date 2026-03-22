### Requirement: Export current phase as PNG
The system SHALL allow a user to download the currently displayed phase diagram as a PNG image file.

#### Scenario: Download PNG for current phase
- **WHEN** the user clicks "Export PNG" from the export menu in the Diagram Canvas toolbar
- **THEN** the system captures the visible ReactFlow canvas as a PNG and triggers a browser download named `<diagram-name>-<phase-id>.png`

#### Scenario: Filename includes diagram name and phase
- **WHEN** the exported PNG is downloaded
- **THEN** the filename SHALL be formatted as `<diagram-name>-<phase-id>.png` using kebab-case (e.g., `my-system-phase-1.png`, `my-system-as-is.png`)

#### Scenario: Export reflects resolved phase state
- **WHEN** the user exports the PNG
- **THEN** the PNG SHALL reflect the current resolved phase (all overrides applied), not the base diagram
