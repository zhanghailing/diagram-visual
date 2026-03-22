## Context

`html-to-image` uses `cloneNode(true)` to capture a DOM snapshot, which copies HTML/SVG attributes but not computed CSS. React Flow renders edge label backgrounds as `<rect class="react-flow__edge-textbg">` elements whose fill color is set entirely via a stylesheet rule. In the cloned DOM, those stylesheet rules are absent, so the rects default to SVG's implicit `fill="black"`, causing solid black blocks to appear in the exported PNG.

The existing `inlineSvgStyles` function in `src/lib/project-io.ts` already addresses a similar issue for edge paths (stroke, opacity, etc.) but does not account for edge label background rects.

## Goals / Non-Goals

**Goals:**
- Edge label background rects render with a white fill in exported PNGs.
- The fix is contained to `inlineSvgStyles`; no other callers or behaviors are affected.

**Non-Goals:**
- Supporting transparent or custom-color label backgrounds in export.
- Fixing any other CSS-to-clone rendering gaps beyond edge label backgrounds.

## Decisions

**Force white fill on `.react-flow__edge-textbg` rects before capture.**

Within `inlineSvgStyles`, after inlining general SVG properties, add a targeted pass that queries all `.react-flow__edge-textbg` elements and sets `fill: white` inline, storing the previous value for restoration. This is simpler and more reliable than trying to derive the correct fill from computed styles (which may return `rgb(0,0,0)` if the class rule isn't inherited).

Alternative considered: extend `SVG_STYLE_PROPS` to always inline `fill` for all elements. Rejected because setting `fill: black` inline on edge path elements would override intentional styling and is harder to restore cleanly.

## Risks / Trade-offs

- [Risk] Future React Flow versions may change the class name. → Low likelihood; `react-flow__edge-textbg` is part of React Flow's stable public class API.
- [Trade-off] Hardcoding white fill assumes a white canvas background. → Acceptable: `captureReactFlowPng` already sets `backgroundColor: '#ffffff'`, so the export is always on a white canvas.
