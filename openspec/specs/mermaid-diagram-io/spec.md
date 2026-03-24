### Requirement: Import Mermaid syntax into a Mermaid diagram
The system SHALL allow users to import Mermaid syntax into a diagram of type `mermaid` by pasting code or uploading a `.mmd` file. The imported code SHALL replace the diagram's current `mermaidCode`.

#### Scenario: Import via paste
- **WHEN** user opens the import dialog and pastes valid Mermaid syntax
- **THEN** the diagram's `mermaidCode` is updated and the preview re-renders

#### Scenario: Import via .mmd file upload
- **WHEN** user selects a `.mmd` file through the import dialog
- **THEN** the file contents are read and set as the diagram's `mermaidCode`

#### Scenario: Import invalid syntax shows error
- **WHEN** user imports Mermaid syntax that fails to render
- **THEN** the system shows an error and does NOT overwrite the existing `mermaidCode`

### Requirement: Export Mermaid diagram as .mmd file
The system SHALL allow users to download the current `mermaidCode` as a `.mmd` plain-text file.

#### Scenario: Export .mmd file
- **WHEN** user clicks "Export as .mmd"
- **THEN** the browser downloads a file named `<diagram-name>.mmd` containing the raw Mermaid code

### Requirement: Export Mermaid diagram as SVG
The system SHALL allow users to download the rendered SVG output of the current Mermaid diagram.

#### Scenario: Export SVG file
- **WHEN** user clicks "Export as SVG"
- **THEN** the browser downloads a file named `<diagram-name>.svg` containing the rendered SVG markup

### Requirement: Export Mermaid diagram as PNG
The system SHALL allow users to download a PNG raster image of the rendered Mermaid diagram.

#### Scenario: Export PNG file
- **WHEN** user clicks "Export as PNG"
- **THEN** the browser downloads a file named `<diagram-name>.png` rendered from the SVG output
