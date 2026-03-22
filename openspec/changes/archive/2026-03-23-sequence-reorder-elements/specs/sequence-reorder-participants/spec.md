## MODIFIED Requirements

### Requirement: Reorder participants by dragging
The system SHALL allow users to reorder participants in a sequence diagram by dragging participant header boxes. The new order SHALL be persisted via updated `order` field values across `baseParticipants` AND all phase-added participants in `sequencePhases[phaseId].addedParticipants`.

#### Scenario: Drag participant to new position
- **WHEN** the user drags a participant header box to a different position
- **THEN** the participant is moved to the target position
- **THEN** all affected participants have their `order` values updated in the correct storage location (base or phase-specific)
- **THEN** the sequence diagram re-renders with the new participant order

#### Scenario: Reorder includes phase-added participants
- **WHEN** the active phase is not "as-is"
- **WHEN** some participants were added in the current or prior phases
- **WHEN** the user drags a phase-added participant to a new position
- **THEN** the phase-added participant's `order` value SHALL be updated in `sequencePhases[phaseId].addedParticipants`
- **THEN** the diagram SHALL reflect the new order

#### Scenario: Participant order persisted across reloads
- **WHEN** the user reorders participants
- **THEN** the new order SHALL be saved to local storage
- **THEN** reloading the app SHALL show participants in the same order
