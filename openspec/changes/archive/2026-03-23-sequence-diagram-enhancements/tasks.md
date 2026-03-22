## 1. Phase Switcher

- [x] 1.1 Add local `activePhase` state to `SequenceDiagramView` (default to `'as-is'`)
- [x] 1.2 Import and render `PhaseSwitcher` component in the sequence diagram toolbar, wired to `activePhase` state
- [x] 1.3 Pass `activePhase` to `resolveSequence()` so the rendered participants/messages reflect the selected phase
- [x] 1.4 Verify phase accumulation: switching to Phase 1 shows base + Phase 1 additions; As-Is shows only base

## 2. Mermaid Import

- [x] 2.1 Add an "Import Mermaid" button to the sequence diagram toolbar
- [x] 2.2 Wire the button to open `MermaidImportDialog` (or equivalent) scoped to `sequence` diagram type
- [x] 2.3 In the import callback, iterate parsed participants and call `addSequenceParticipant(diagramId, activePhase, participant)` for each
- [x] 2.4 In the import callback, iterate parsed messages and call `addSequenceMessage(diagramId, activePhase, message)` for each
- [x] 2.5 Verify error handling: non-sequence Mermaid input shows an error in the dialog without modifying the diagram

## 3. Export PNG (Current Phase)

- [x] 3.1 Add a `ref` to the sequence diagram container div in `SequenceDiagramView`
- [x] 3.2 Add "Export PNG" button to the sequence diagram toolbar
- [x] 3.3 Implement `exportSequenceToPng(ref, diagramName, phaseId)` using `html-to-image.toPng()` on the container ref
- [x] 3.4 Trigger download of the resulting PNG blob with filename `<diagram-name>-<phase-id>.png`
- [x] 3.5 Show a loading/disabled state on the export button while capture is in progress

## 4. Export All Phases as ZIP

- [x] 4.1 Add "Export All Phases" button to the sequence diagram toolbar (or as a dropdown alongside Export PNG)
- [x] 4.2 Implement `exportAllSequencePhases(diagramId, diagramName, phases)`: iterate phases, set active phase, await re-render tick, capture PNG per phase
- [x] 4.3 Bundle all captured PNGs into a ZIP using `jszip`, with each file named `<diagram-name>-<phase-id>.png`
- [x] 4.4 Trigger download of the ZIP file with filename `<diagram-name>-all-phases.zip`
- [x] 4.5 Disable both export buttons and show loading state during the full ZIP capture cycle
- [x] 4.6 Restore the originally active phase after ZIP export completes (or on error)
