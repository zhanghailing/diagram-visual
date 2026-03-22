## Why

The sequence diagram view lacks parity with the architecture/C4 canvas: it has no phase switcher, no Mermaid import, and no PNG export. Users working on migration planning need to tell a phased story in sequence diagrams—showing how interactions evolve across phases—and export those views for sharing.

## What Changes

- Add a **Mermaid import** button to the sequence diagram toolbar, allowing users to paste Mermaid `sequenceDiagram` syntax and populate participants and messages.
- Add a **phase switcher** to the sequence diagram view so users can switch between phases and see phase-accumulated participants/messages (the underlying phase data model already exists).
- Add an **Export PNG** action that captures the current phase of the sequence diagram as a PNG file.
- Add an **Export All Phases PNG** action that captures each phase as a PNG and downloads them as a ZIP archive.

## Capabilities

### New Capabilities

- `sequence-mermaid-import`: Import participants and messages from Mermaid `sequenceDiagram` syntax into the sequence diagram view.
- `sequence-phase-switcher`: Phase switcher UI in the sequence diagram toolbar to navigate between phases and see cumulative phase state.
- `sequence-export`: Export the current sequence diagram phase as PNG, or export all phases as a ZIP of PNGs.

### Modified Capabilities

<!-- No existing spec-level requirements are changing -->

## Impact

- `src/views/SequenceDiagramView.tsx` — primary file; toolbar, phase state, rendering
- `src/lib/mermaid-parser.ts` — already has `parseMermaidSequence()`, re-used as-is
- `src/lib/project-io.ts` — PNG/ZIP export helpers, adapted for sequence diagram (non-React-Flow DOM element)
- `src/components/MermaidImportDialog.tsx` — reused or adapted for sequence context
- `src/store/index.ts` — `addSequenceParticipant`, `addSequenceMessage` already exist; phase actions already exist
- New dependency on `html-to-image` (already installed) for sequence diagram DOM capture
- New dependency on `jszip` (already installed) for ZIP export
