## Context

**Participant reordering (broken):** The existing `reorderSequenceParticipants` store action resolves all visible participants up to the active phase, computes new `order` values, but then only writes back to `baseParticipants`. Participants that were introduced in a later phase (stored in `sequencePhases[phaseId].addedParticipants`) never get their `order` updated, so the reorder has no effect on them.

**Message reordering (missing):** Messages are ordered by their `order` field (numeric), which is assigned at creation time and never changed. There is no UI or store action to reorder messages. Messages are rendered in the SVG and listed in the visibility panel (added in the previous change), but the panel rows are not draggable.

## Goals / Non-Goals

**Goals:**
- Fix participant reorder to write updated `order` values back to phase-added participants in `sequencePhases[phase].addedParticipants`
- Add `reorderSequenceMessages` store action (mirrors `reorderSequenceParticipants` logic but for messages)
- Add drag-to-reorder on message rows in the visibility panel

**Non-Goals:**
- Reordering participants via anything other than the existing drag-on-header-boxes UI
- Cross-phase reordering (reorder only affects the elements visible in the current phase)
- Reordering participants added in a phase other than the current one

## Decisions

### 1. Fix participant reorder — write back to phase participants too

**Decision:** After computing `withOrders`, also update `sequencePhases[phase].addedParticipants` with their new order values (not just `baseParticipants`).

**Rationale:** The current code builds a combined list of all participants up to the current phase, assigns new `order` values, then filters by `baseIds` — losing the phase-added participants' updates. We need to also filter by each phase's added participant IDs and update those arrays too.

Since `order` is a global sort key shared across base and all phases, reassigning orders from a sorted combined list is the right approach — we just need to propagate the updates to every array that holds a participant.

### 2. Message reorder store action — same pattern as participant reorder

**Decision:** Implement `reorderSequenceMessages(diagramId, phase, fromIdx, toIdx)` following the same logic:
1. Resolve all messages up to the current phase (without hidden filtering, so indices are stable)
2. Move the message at `fromIdx` to `toIdx`
3. Reassign `order` values (0, 1, 2, …)
4. Write back to `baseMessages` and each relevant `sequencePhases[phaseId].addedMessages`

### 3. Message reorder UI — drag handles on visibility panel rows

**Decision:** Add drag-and-drop to the message buttons in the visibility panel (already added in the previous change). Each message row gets a drag handle icon on the left. Dragging reorders via `reorderSequenceMessages`.

**Alternatives considered:**
- Up/down arrow buttons — simpler but slower UX for long lists; drag is more natural
- SVG drag on message arrows — hard to implement (SVG drag API is limited), and messages already have a row representation in the visibility panel

**Rationale:** The visibility panel already provides a row-per-message list, making it the natural place for drag reordering. Consistent with how participants use drag on their header boxes.

## Risks / Trade-offs

- **Risk**: Participant reorder fix touches `reorderSequenceParticipants` which has existing drag logic; incorrect update could corrupt order — **Mitigation**: write unit-testable logic, update all relevant arrays atomically
- **Risk**: Message drag in visibility panel is only available in non-as-is phases (panel is hidden in as-is) — **Mitigation**: in as-is phase, message order is determined by creation order; acceptable for now
