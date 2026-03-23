## ADDED Requirements

### Requirement: User can open a JSON paste import dialog
The system SHALL provide a way to open a modal dialog where the user can paste raw project JSON to import a project.

#### Scenario: User opens the import dialog
- **WHEN** the user clicks the "Import from JSON" button in the toolbar
- **THEN** a modal dialog opens containing a textarea and a confirm button

### Requirement: User can paste and confirm valid project JSON
The system SHALL accept a valid JSON string representing a Project, parse it, migrate it if needed, and load it into the application.

#### Scenario: User pastes valid JSON and confirms
- **WHEN** the user pastes valid project JSON into the textarea and clicks "Import"
- **THEN** the dialog closes and the application loads the imported project, replacing the current one

#### Scenario: User pastes JSON for an older project version
- **WHEN** the user pastes JSON with `version: 1` and clicks "Import"
- **THEN** the project is migrated to the current version and loaded successfully

### Requirement: Invalid JSON produces an inline error
The system SHALL validate the pasted text and display an inline error message without closing the dialog when the input is not valid.

#### Scenario: User pastes malformed JSON
- **WHEN** the user pastes text that is not valid JSON and clicks "Import"
- **THEN** an error message is shown below the textarea and the dialog remains open

#### Scenario: User pastes JSON that fails schema validation
- **WHEN** the user pastes JSON that parses successfully but fails `migrateProject` validation and clicks "Import"
- **THEN** an error message describing the failure is shown below the textarea and the dialog remains open

### Requirement: User can cancel the import dialog
The system SHALL allow the user to dismiss the dialog without importing anything.

#### Scenario: User cancels the dialog
- **WHEN** the user clicks "Cancel" or closes the dialog
- **THEN** the dialog closes and the current project is unchanged
