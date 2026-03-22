## Why

When exporting a diagram to PNG, edge label background rectangles (`react-flow__edge-textbg`) render as solid black blocks. This happens because `html-to-image` clones the DOM without CSS stylesheets, causing SVG `<rect>` elements that rely on CSS for their fill color to fall back to SVG's default black fill.

## What Changes

- Extend `inlineSvgStyles` in `src/lib/project-io.ts` to explicitly force edge label background rects (`.react-flow__edge-textbg`) to use a white fill before PNG capture, overriding any computed or default value.

## Capabilities

### New Capabilities

- `png-export-edge-labels`: PNG export correctly renders edge label backgrounds as white/transparent instead of black blocks.

### Modified Capabilities

<!-- None -->

## Impact

- `src/lib/project-io.ts` — `inlineSvgStyles` function modified to handle edge label background rects.
- No API changes, no dependency changes.
