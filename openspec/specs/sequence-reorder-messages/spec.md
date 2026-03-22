## ADDED Requirements

### Requirement: Reorder messages by dragging
The system SHALL allow users to reorder messages in a sequence diagram by dragging message rows in the visibility panel. The new order SHALL be persisted via updated `order` field values across `baseMessages` and phase-added messages.

#### Scenario: Drag message to new position
- **WHEN** the user drags a message row in the visibility panel to a different position
- **THEN** the message is moved to the target position in the display order
- **THEN** all affected messages have their `order` values updated accordingly
- **THEN** the sequence diagram re-renders with the new message order

#### Scenario: Drag handle visible in non-as-is phase
- **WHEN** the active phase is not "as-is"
- **WHEN** the visibility panel is shown
- **THEN** each message row SHALL display a drag handle icon

#### Scenario: Message order persisted across reloads
- **WHEN** the user reorders messages
- **THEN** the new order SHALL be saved to local storage
- **THEN** reloading the app SHALL show messages in the same order
