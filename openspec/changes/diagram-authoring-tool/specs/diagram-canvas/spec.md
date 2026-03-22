## ADDED Requirements

### Requirement: Canvas renders nodes and edges interactively
The system SHALL display diagram elements (nodes and edges) on an interactive canvas that supports pan, zoom, and element selection using `@xyflow/react`.

#### Scenario: User pans the canvas
- **WHEN** the user clicks and drags on an empty area of the canvas
- **THEN** the viewport shifts in the direction of the drag

#### Scenario: User zooms the canvas
- **WHEN** the user scrolls the mouse wheel over the canvas
- **THEN** the viewport zooms in or out centered on the cursor position

#### Scenario: User selects a node
- **WHEN** the user clicks on a node
- **THEN** the node is highlighted and its properties are shown in the side panel

### Requirement: Nodes are draggable
The system SHALL allow users to reposition nodes by dragging them on the canvas.

#### Scenario: User drags a node
- **WHEN** the user clicks and drags a node to a new position
- **THEN** the node moves to the new position and its position is updated in the store

### Requirement: Edges connect nodes
The system SHALL allow users to create edges between nodes by dragging from a source handle to a target handle.

#### Scenario: User draws a new edge
- **WHEN** the user drags from a node's output handle to another node's input handle
- **THEN** a new edge is created connecting the two nodes

#### Scenario: User attempts invalid connection
- **WHEN** the user drags from a handle to an incompatible target (e.g., same node)
- **THEN** no edge is created and the drag is cancelled

### Requirement: Nodes and edges can be deleted
The system SHALL allow users to delete selected nodes or edges.

#### Scenario: User deletes a selected node
- **WHEN** the user selects a node and presses the Delete or Backspace key
- **THEN** the node and all its connected edges are removed from the diagram

### Requirement: Canvas has an element palette
The system SHALL provide a palette of element types that the user can drag onto the canvas to create new nodes.

#### Scenario: User adds a node from palette
- **WHEN** the user drags an element type from the palette and drops it on the canvas
- **THEN** a new node of that type is created at the drop position
