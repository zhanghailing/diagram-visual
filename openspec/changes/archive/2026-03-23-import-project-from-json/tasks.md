## 1. Dialog Component

- [x] 1.1 Create `src/components/JsonImportDialog.tsx` with a Dialog, Textarea, inline error state, and Import/Cancel buttons
- [x] 1.2 On "Import" click: parse the textarea value with `JSON.parse`, pass to `migrateProject`, call `store.loadProject`, and close the dialog — or display the caught error inline
- [x] 1.3 Reset textarea and error state when the dialog is opened

## 2. Toolbar Integration

- [x] 2.1 Add an "Import from JSON" button to the toolbar in `src/App.tsx` (or wherever the existing file import button lives) that opens the `JsonImportDialog`
- [x] 2.2 Verify the button is visually consistent with adjacent toolbar actions
