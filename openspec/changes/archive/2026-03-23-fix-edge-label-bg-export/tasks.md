## 1. Fix inlineSvgStyles in project-io.ts

- [x] 1.1 In `inlineSvgStyles`, add a targeted pass that queries all `.react-flow__edge-textbg` elements within the container, saves their current `fill` inline style, and sets `fill: white` before capture
- [x] 1.2 Add the restore call for edge label bg elements to the returned cleanup function so fill is reset after capture (in both success and error paths via the existing `finally` block)

## 2. Verification

- [x] 2.1 Export a diagram with labelled edges and confirm label backgrounds are white (not black) in the PNG
- [x] 2.2 Confirm the live diagram is visually unchanged after export (no leftover inline styles)

