## Context

The app already supports file-based project import (`importProject(file: File)` in `src/lib/project-io.ts`) and project loading via `store.loadProject(project)`. The `migrateProject` function handles version migration. There is no path for pasting raw JSON text — users must use the OS file picker.

The toolbar area in `App.tsx` houses existing actions (export, new project, file import). The app uses shadcn/ui dialog primitives (Dialog, DialogContent, etc.) for modals, consistent with existing dialogs like `CreatePlanModal` and `MermaidImportDialog`.

## Goals / Non-Goals

**Goals:**
- Let users paste a raw JSON string to import a project
- Reuse `migrateProject` for parsing and migration
- Show clear inline error messages for invalid JSON or schema mismatches
- Keep the dialog pattern consistent with `MermaidImportDialog`

**Non-Goals:**
- Drag-and-drop file import (already exists via file picker)
- JSON schema editor or interactive builder
- Merging imported project with existing project (replaces current project, same as file import)

## Decisions

### Decision 1: Modal dialog with a textarea

Use a Dialog + Textarea pattern (matching `MermaidImportDialog`) rather than an inline panel or a toast workflow.

**Why**: The existing import dialog pattern (MermaidImportDialog) is already familiar to users, and its two-step (paste → confirm) flow gives users a chance to review before committing. A toast/inline path would skip confirmation.

**Alternatives considered**: Inline collapsible panel — rejected because it would clutter the toolbar area and not match the existing UI conventions.

### Decision 2: Reuse `migrateProject` directly

Parse `JSON.parse(text)` then pass the result to the existing `migrateProject` function in `project-io.ts`.

**Why**: Centralizes validation and migration logic. No duplication. If migration logic changes, both import paths benefit automatically.

**Alternatives considered**: Duplicate validation inline — rejected for obvious maintenance reasons.

### Decision 3: Error display inline in the dialog

Show validation errors as a red message below the textarea, not via a toast.

**Why**: Inline errors let the user fix the pasted text without dismissing and reopening the dialog. Toasts disappear and are hard to read while editing.

## Risks / Trade-offs

- [Large paste performance] Very large JSON payloads (thousands of nodes) may cause momentary UI freeze during `JSON.parse`. → Mitigation: acceptable for current use case; can defer to a Web Worker if it becomes an issue.
- [Accidental overwrite] Import replaces the current project without warning. → Mitigation: the existing file import has the same behavior and there is no undo; acceptable for now. A confirmation prompt can be added later.

## Open Questions

- Should the dialog show a preview (project name / component count) before confirming? Deferred — out of scope for MVP.
