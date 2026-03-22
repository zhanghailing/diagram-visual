## ADDED Requirements

### Requirement: Hide participant in phase
The system SHALL allow a user to hide any participant in a sequence diagram phase (excluding the "as-is" phase). A hidden participant SHALL NOT be rendered in the diagram for that phase. The participant SHALL remain visible in all earlier phases where it was not explicitly hidden.

#### Scenario: Hide a participant in a non-as-is phase
- **WHEN** the active phase is not "as-is"
- **WHEN** the user clicks the hide toggle for a participant
- **THEN** the participant is added to `hiddenParticipantIds` for that phase
- **THEN** the participant is no longer rendered in the diagram for that phase

#### Scenario: Unhide a participant in a non-as-is phase
- **WHEN** the active phase is not "as-is"
- **WHEN** a participant is currently hidden (its ID is in `hiddenParticipantIds`)
- **WHEN** the user clicks the hide toggle again
- **THEN** the participant is removed from `hiddenParticipantIds`
- **THEN** the participant is rendered again in the diagram for that phase

#### Scenario: Hide controls not available in as-is phase
- **WHEN** the active phase is "as-is"
- **THEN** no hide toggle SHALL be shown for participants

### Requirement: Hide message in phase
The system SHALL allow a user to hide any message in a sequence diagram phase (excluding the "as-is" phase). A hidden message SHALL NOT be rendered in the diagram for that phase. The message SHALL remain visible in all earlier phases where it was not explicitly hidden.

#### Scenario: Hide a message in a non-as-is phase
- **WHEN** the active phase is not "as-is"
- **WHEN** the user clicks the hide toggle for a message
- **THEN** the message is added to `hiddenMessageIds` for that phase
- **THEN** the message is no longer rendered in the diagram for that phase

#### Scenario: Unhide a message in a non-as-is phase
- **WHEN** the active phase is not "as-is"
- **WHEN** a message is currently hidden (its ID is in `hiddenMessageIds`)
- **WHEN** the user clicks the hide toggle again
- **THEN** the message is removed from `hiddenMessageIds`
- **THEN** the message is rendered again in the diagram for that phase

#### Scenario: Hide controls not available in as-is phase
- **WHEN** the active phase is "as-is"
- **THEN** no hide toggle SHALL be shown for messages

### Requirement: Visual indication of hidden elements
The system SHALL visually distinguish hidden participants and messages from visible ones in the editor UI while in a non-as-is phase, so users know an element exists but is currently hidden.

#### Scenario: Hidden participant shown as muted in editor
- **WHEN** the active phase is not "as-is"
- **WHEN** a participant is in `hiddenParticipantIds` for the current phase
- **THEN** the participant row in the editor SHALL display a visual indicator (e.g., eye-slash icon, muted/strikethrough style)

#### Scenario: Hidden message shown as muted in editor
- **WHEN** the active phase is not "as-is"
- **WHEN** a message is in `hiddenMessageIds` for the current phase
- **THEN** the message row in the editor SHALL display a visual indicator (e.g., eye-slash icon, muted/strikethrough style)
