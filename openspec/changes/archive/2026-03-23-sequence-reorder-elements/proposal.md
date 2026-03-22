## Why

Users building sequence diagrams need to control the visual order of participants (left-to-right) and messages (top-to-bottom). Participant drag-to-reorder exists but is broken for participants added in non-as-is phases (order updates are only written back to `baseParticipants`, ignoring phase-added ones). Message reordering doesn't exist at all.

## What Changes

- Fix `reorderSequenceParticipants` in the store to also write updated order values back to phase-added participants (`sequencePhases[phase].addedParticipants`)
- Add `reorderSequenceMessages` store action to reorder messages by updating their `order` fields across `baseMessages` and phase-added messages
- Add drag-to-reorder UI for messages in the sequence diagram view (using the existing visibility panel rows as drag targets)

## Capabilities

### New Capabilities
- `sequence-reorder-messages`: Drag-to-reorder messages in a sequence diagram, persisting the new `order` values

### Modified Capabilities
- `sequence-reorder-participants`: Fix the existing participant reorder action to correctly persist order for phase-added participants (not just base participants)

## Impact

- `src/store/index.ts` — fix `reorderSequenceParticipants` to update phase-added participant orders; add `reorderSequenceMessages`
- `src/views/SequenceDiagramView.tsx` — add drag handles to message rows in the visibility panel; existing participant drag-to-reorder UI unchanged
- `src/types/index.ts` — no changes needed
