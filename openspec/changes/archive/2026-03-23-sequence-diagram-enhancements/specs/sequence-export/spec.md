## ADDED Requirements

### Requirement: Export current sequence diagram phase as PNG
The sequence diagram toolbar SHALL include an export action that captures the currently visible sequence diagram (participants header + lifelines + messages) as a PNG image and downloads it to the user's device.

#### Scenario: Export current phase PNG
- **WHEN** user clicks "Export PNG" in the sequence diagram toolbar
- **THEN** the system captures the sequence diagram DOM as a PNG image
- **THEN** the PNG is downloaded with a filename of `<diagram-name>-<phase-id>.png`

#### Scenario: PNG includes all visible elements
- **WHEN** the PNG is captured
- **THEN** it includes the participant header row
- **THEN** it includes all lifelines and message arrows
- **THEN** it includes message labels

### Requirement: Export all phases as ZIP of PNGs
The sequence diagram toolbar SHALL include an export action that captures each phase of the sequence diagram as a separate PNG and bundles all PNGs into a single ZIP file download.

#### Scenario: Export all phases ZIP
- **WHEN** user clicks "Export All Phases" in the sequence diagram toolbar
- **THEN** the system iterates through all phases defined on the diagram
- **THEN** for each phase, the system captures a PNG of the sequence diagram in that phase's state
- **THEN** all PNGs are bundled into a ZIP file
- **THEN** the ZIP is downloaded with a filename of `<diagram-name>-all-phases.zip`

#### Scenario: ZIP contains one PNG per phase
- **WHEN** a diagram has 3 phases (As-Is, Phase 1, Phase 2)
- **THEN** the downloaded ZIP SHALL contain exactly 3 PNG files
- **THEN** each PNG file is named `<diagram-name>-<phase-id>.png`

#### Scenario: Export is disabled during capture
- **WHEN** an export (single or all phases) is in progress
- **THEN** the export buttons SHALL be disabled to prevent concurrent exports
- **THEN** a loading indicator is shown while capture is in progress
