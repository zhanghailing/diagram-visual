## Context

`SequenceDiagramView.tsx` renders participants as a flat HTML header row and messages as SVG lines. The store already holds `SequencePhaseState` per phase (added participants, added messages, hidden element IDs), and `resolveSequence()` already accumulates phases. However, the view has no toolbar controls for phases, no Mermaid import entry point, and no export capability. The architecture/C4 canvas (`DiagramCanvasView.tsx`) has all three; this change brings parity to the sequence view.

## Goals / Non-Goals

**Goals:**
- Phase switcher in the sequence diagram toolbar (reuse `PhaseSwitcher` component)
- Mermaid import dialog in the sequence diagram toolbar (reuse `MermaidImportDialog` or inline)
- Export current phase as PNG (capture the sequence diagram DOM node)
- Export all phases as ZIP of PNGs

**Non-Goals:**
- Adding new Mermaid parsing logic (existing `parseMermaidSequence()` is sufficient)
- Changing the sequence diagram rendering engine
- Supporting Mermaid export (only import)
- Editing phase labels or adding/deleting phases from the sequence view (covered by existing phase editor popover, can be wired later)

## Decisions

### 1. Phase switcher: reuse `PhaseSwitcher` component
`PhaseSwitcher` already accepts `diagramId`, `activePhase`, and `onChange`. Wire it into the sequence toolbar the same way `DiagramCanvasView` does. The `resolveSequence()` function already handles cumulative phase accumulation—no new logic needed.

**Alternative considered:** Inline phase tabs in the toolbar. Rejected: `PhaseSwitcher` already handles edge cases (as-is label, custom phases) and keeps UI consistent.

### 2. Mermaid import: reuse `MermaidImportDialog` component
`MermaidImportDialog` already fires a callback with parsed data. For sequence diagrams, the callback dispatches `addSequenceParticipant` and `addSequenceMessage` into the active phase. The dialog already validates that the parsed diagram type matches (`sequence`).

**Alternative considered:** Inline textarea without the dialog. Rejected: the dialog handles validation and error display already.

### 3. PNG export: `html-to-image.toPng()` on the sequence diagram container div
The sequence diagram renders into a scrollable `div` (not a React Flow canvas). We add a `ref` to this container and call `toPng(ref.current)` directly. This captures the SVG lifelines + HTML participant headers as a single image.

**Challenge:** The participant headers are HTML (not SVG), so `html-to-image` must capture a mixed HTML+SVG subtree. `html-to-image` handles this via DOM cloning—it works in practice for this layout.

**Alternative considered:** Rendering to a hidden off-screen SVG for export. Rejected: requires duplicating the render logic and is complex to maintain.

### 4. Export all phases: iterate phases, capture each, zip with JSZip
For each phase in `diagram.phaseOrder`, temporarily set the active phase, wait a tick for React to re-render, capture PNG, then restore. Bundle all PNGs into a ZIP using the already-installed `jszip` library.

**Risk with render timing:** React state updates are async. We must `await` a forced re-render between phase switches. We'll use a `Promise`-based approach with `flushSync` or a small `setTimeout(resolve, 0)` after `setState` to ensure the DOM is updated before capture.

**Alternative considered:** Rendering each phase to an off-screen clone. Rejected: would require re-implementing `resolveSequence` rendering outside of React.

## Risks / Trade-offs

- **html-to-image mixed HTML+SVG capture** — Cross-browser font and style inlining may produce slightly different results than the live view. Mitigation: test on target browsers; the existing canvas export has the same limitation and is already accepted.
- **Export all phases flicker** — Phase switching for bulk export is visible to the user as a brief flash. Mitigation: show a loading state / disable UI during export. A fully invisible export would require significant refactor.
- **Mermaid import overwrites vs. merges** — Importing appends to the active phase (not replace). Users may accidentally double-import. Mitigation: document in the dialog; a "replace" mode can be added later.

## Migration Plan

No data migration needed. All changes are additive UI and new action wiring. Existing sequence diagrams are unaffected.

## Open Questions

- Should importing Mermaid into a non-base phase append to that phase, or always import to the base? Current decision: append to active phase (consistent with how manual "add" works).
- Should the phase switcher also show the `PhaseEditorPopover` (add/rename/delete phases) in the sequence view? Not in scope for this change; can be wired in a follow-up.
