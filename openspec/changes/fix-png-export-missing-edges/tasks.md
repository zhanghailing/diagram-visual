## 1. Fix PNG capture helper

- [x] 1.1 In `src/lib/project-io.ts`, update `exportCanvasToPng` to target `.react-flow__viewport` inside the container element, falling back to the container if not found
- [x] 1.2 Pass explicit `width` and `height` (from the container's `getBoundingClientRect`) to `toPng` so the viewport is captured at the correct size
- [x] 1.3 Apply the same fix to `capturePng` (used for ZIP export)

## 2. Verify edge visibility

- [x] 2.1 Automated cypress test: export a PNG on a diagram with edges and confirm lines and arrowheads appear
- [x] 2.2 Automated cypress test: export all-phases ZIP and confirm edges are present in each phase image

