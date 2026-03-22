## ADDED Requirements

### Requirement: Export all phases as a ZIP of PNGs
The system SHALL allow a user to download all phases of the current diagram as individual PNG files bundled in a single ZIP archive.

#### Scenario: Download ZIP of all phase PNGs
- **WHEN** the user clicks "Export All Phases (ZIP)" from the export menu in the Diagram Canvas toolbar
- **THEN** the system SHALL resolve each phase (as-is, phase-1, phase-2), capture each as a PNG, bundle them into a ZIP file, and trigger a browser download named `<diagram-name>-all-phases.zip`

#### Scenario: ZIP contains one PNG per phase
- **WHEN** the ZIP is downloaded
- **THEN** it SHALL contain files named `<diagram-name>-as-is.png`, `<diagram-name>-phase-1.png`, `<diagram-name>-phase-2.png`

#### Scenario: Each PNG reflects its resolved phase
- **WHEN** a PNG is generated for a given phase inside the ZIP
- **THEN** it SHALL reflect the fully resolved state of that phase (all overrides applied up to and including that phase)
