## Why

Users need to fine-tune edge label placement in diagrams to avoid overlapping nodes or other labels, and those custom positions should persist so diagrams look correct every time they are opened or exported.

## What Changes

- Edge labels can be dragged to a custom position relative to their edge
- The custom label offset is stored in the diagram data model per edge
- Diagram save/load and export preserve the label position
- If no custom position is set, the default midpoint behavior is unchanged

## Capabilities

### New Capabilities

- `edge-label-positioning`: Drag-to-reposition edge labels with persisted offset stored in the diagram model and honored on load and export

### Modified Capabilities

- (none)

## Impact

- `DiagramCanvas` / edge rendering component — must render label at stored offset
- Diagram data model (edge schema) — new `labelOffset` field (`{ x, y }`)
- Save/load serialization — must read and write `labelOffset`
- Export (image/SVG) — must apply `labelOffset` when rendering edge labels
- Drag interaction layer — new drag handle on edge labels
