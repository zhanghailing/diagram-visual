## Why

In sequence diagrams, phases represent evolving system states — but users have no way to hide specific participants or messages within a phase view. This forces diagrams to always show all elements, even when some are irrelevant or intentionally removed in a later phase.

## What Changes

- Add a "hide" toggle for each participant in the phase panel/editor, allowing it to be excluded from the current phase's view
- Add a "hide" toggle for each message in the phase panel/editor, allowing it to be excluded from the current phase's view
- Hidden participants and messages are stored in `hiddenParticipantIds` / `hiddenMessageIds` on the phase state (the data model already supports this)
- Hidden elements remain visible in earlier phases where they were not hidden

## Capabilities

### New Capabilities
- `phase-hide-elements`: Ability to hide individual participants and messages within a specific sequence diagram phase

### Modified Capabilities

## Impact

- `src/views/SequenceDiagramView.tsx` — phase editing UI needs hide/show controls for participants and messages
- `src/store/index.ts` — needs actions to toggle `hiddenParticipantIds` / `hiddenMessageIds` per phase
- `src/types/index.ts` — no changes needed (data model already has `hiddenParticipantIds` / `hiddenMessageIds`)
- `src/components/PhaseEditorPopover.tsx` — may need updates to surface hide controls
