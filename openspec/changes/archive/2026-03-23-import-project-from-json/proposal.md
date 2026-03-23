## Why

Users currently can only import a project by selecting a `.migplan.json` file through the file picker. There is no way to paste a project JSON directly, which is cumbersome when a project is shared as text (e.g., via chat, clipboard, or a code snippet). This feature adds a paste-to-import path so users can quickly load a project from raw JSON text without needing a file.

## What Changes

- Add a "Import from JSON" dialog/modal where the user can paste raw JSON text
- Parse and validate the pasted text using the existing `migrateProject` logic
- Load the parsed project into the store via `loadProject`
- Surface an error message inline if the JSON is invalid or fails validation
- Add a trigger button in the toolbar/header alongside the existing file import action

## Capabilities

### New Capabilities
- `json-paste-import`: Allows the user to import a project by pasting its JSON text into a textarea dialog, with inline validation feedback and project loading on confirm.

### Modified Capabilities
<!-- none -->

## Impact

- **UI**: New modal component (`JsonImportDialog`) and a trigger button in the top toolbar
- **Logic**: Reuses `migrateProject` and `loadProject` from existing `project-io.ts` and the store — no new business logic needed
- **No breaking changes**: Existing file-based import is untouched
