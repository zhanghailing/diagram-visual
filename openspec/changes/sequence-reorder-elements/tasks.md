## 1. Fix Participant Reorder Store Action

- [x] 1.1 In `reorderSequenceParticipants` (`src/store/index.ts`), after computing `withOrders`, also write updated `order` values back to `sequencePhases[phaseId].addedParticipants` for each phase up to and including the active phase
- [x] 1.2 Use `getPhaseOrder(d)` instead of the hardcoded `['as-is', 'phase-1', 'phase-2']` array in `reorderSequenceParticipants`

## 2. Add Message Reorder Store Action

- [x] 2.1 Add `reorderSequenceMessages(diagramId, phase, fromIdx, toIdx)` to the store interface in `src/store/index.ts`
- [x] 2.2 Implement `reorderSequenceMessages`: resolve all messages up to the current phase (without hidden filtering), move the message from `fromIdx` to `toIdx`, reassign `order` values, write back to `baseMessages` and all relevant `sequencePhases[phaseId].addedMessages`

## 3. Message Reorder UI

- [x] 3.1 Import `GripVertical` from lucide-react and `reorderSequenceMessages` from the store in `SequenceDiagramView.tsx`
- [x] 3.2 Add drag state for messages (`dragOverMsgIdx`) alongside the existing `dragOverIdx` participant state
- [x] 3.3 Add drag handles and drag event handlers (`draggable`, `onDragStart`, `onDragOver`, `onDrop`) to each message row in the visibility panel, calling `reorderSequenceMessages` on drop
