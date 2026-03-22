## Context

The sequence diagram already has a full data model for hiding elements per phase (`hiddenParticipantIds` and `hiddenMessageIds` on `SequencePhaseState`), and the `resolveSequence` function already filters them out during rendering. However, there is no UI to actually toggle visibility. Users cannot hide a participant or message in a given phase — they can only add new ones.

The phase editing currently lives in `PhaseEditorPopover.tsx` and participant/message controls live inline in `SequenceDiagramView.tsx`.

## Goals / Non-Goals

**Goals:**
- Let users toggle visibility of any participant or message within a non-"as-is" phase
- Store hide state in the existing `hiddenParticipantIds` / `hiddenMessageIds` fields
- Reflect hidden state visually in the diagram (elements are not rendered when hidden)

**Non-Goals:**
- Hiding elements in the "as-is" phase (as-is is the base truth; hiding there would mean deletion)
- Hiding newly-added elements that belong to the current phase (you can just delete them instead)
- Persisting hide state across exports or mermaid code generation (out of scope for now)

## Decisions

### 1. Where to place hide controls

**Decision**: Add hide toggles inline in the participant list and message list within `SequenceDiagramView.tsx`, visible when the active phase is not "as-is".

**Alternatives considered**:
- Put hide controls in `PhaseEditorPopover.tsx` — rejected because the popover is for phase metadata (name, order), not element-level control
- Separate "hide panel" modal — rejected as overkill for a simple toggle

**Rationale**: Inline controls keep the interaction close to the element being hidden and match the existing pattern for add/delete controls.

### 2. Store actions

**Decision**: Add two new store actions: `toggleHideSequenceParticipant(diagramId, phaseId, participantId)` and `toggleHideSequenceMessage(diagramId, phaseId, messageId)`.

Each action will add the ID to `hiddenParticipantIds` / `hiddenMessageIds` if not present, or remove it if already present.

### 3. Visual treatment for hidden elements in the editor

**Decision**: When in a phase where an element is hidden, show the element with a strikethrough or muted style in the participant/message list so users know it exists but is hidden. Clicking the eye icon re-shows it.

**Rationale**: Users need to be able to un-hide elements, so hidden elements must remain visible in the editor (just marked as hidden).

## Risks / Trade-offs

- **Risk**: Users may be confused that hidden elements still appear in the editor list → Mitigation: clear visual distinction (eye-slash icon + muted style)
- **Risk**: "As-is" phase has no hide controls but users may expect it → Mitigation: hide controls are only rendered for non-as-is phases; add a tooltip if needed
