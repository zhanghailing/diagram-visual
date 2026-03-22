## 1. Store Actions

- [x] 1.1 Add `toggleHideSequenceParticipant(diagramId, phaseId, participantId)` action to `src/store/index.ts`
- [x] 1.2 Add `toggleHideSequenceMessage(diagramId, phaseId, messageId)` action to `src/store/index.ts`

## 2. Participant Hide UI

- [x] 2.1 In `SequenceDiagramView.tsx`, show an eye/eye-slash toggle button on each participant row when the active phase is not "as-is"
- [x] 2.2 Wire the toggle button to `toggleHideSequenceParticipant` store action
- [x] 2.3 Apply muted/strikethrough style to participant rows that are in `hiddenParticipantIds` for the current phase

## 3. Message Hide UI

- [x] 3.1 In `SequenceDiagramView.tsx`, show an eye/eye-slash toggle button on each message row when the active phase is not "as-is"
- [x] 3.2 Wire the toggle button to `toggleHideSequenceMessage` store action
- [x] 3.3 Apply muted/strikethrough style to message rows that are in `hiddenMessageIds` for the current phase
