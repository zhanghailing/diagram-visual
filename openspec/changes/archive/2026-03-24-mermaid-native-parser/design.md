## Context

The app already depends on `mermaid ^11.13.0` but only uses it for rendering (via `mermaid.render()`). Parsing is done separately by hand-written regex parsers in `src/lib/mermaid-parser.ts`. Mermaid's own package exposes an internal parser (`@mermaid-js/parser`) which produces a typed AST for all supported diagram types. Using this AST instead of regex eliminates the syntax gap.

## Goals / Non-Goals

**Goals:**
- Use Mermaid's internal AST to parse flowchart, sequence, and C4 diagrams
- Preserve the existing public API shape of `mermaid-parser.ts` (same function names, same return types)
- Make parsing async (Mermaid's parser is async)
- Surface unsupported constructs as non-fatal warnings rather than silent drops
- Pass all existing `mermaid-parser.test.ts` scenarios with the new implementation

**Non-Goals:**
- Support every Mermaid diagram type (gantt, pie, etc.) — these remain unsupported
- Change the rendering pipeline (Mermaid rendering is out of scope)
- Change the store, types, or view components beyond the import dialog

## Decisions

### 1. Use `@mermaid-js/parser` directly (not `mermaid.parse()`)

`mermaid` v11 ships `@mermaid-js/parser` as a re-exported subpath. It can be imported as:
```ts
import { parse } from 'mermaid/dist/diagram-api/regexes.js'
```
…or more reliably via the `mermaid` package's own parser utility:
```ts
import mermaid from 'mermaid'
await mermaid.parse(text) // throws on syntax error, returns true on success
```
However, to get a structured AST we use `@mermaid-js/parser`:
```ts
import { parse } from '@mermaid-js/parser'
const ast = parse('sequenceDiagram', text)
```
This returns a fully typed AST and throws a `ParseError` on invalid syntax. This is preferable to regex because it handles all Mermaid grammar rules automatically.

**Alternative considered**: Keep regex but extend it. Rejected because Mermaid's grammar is complex and regex would need ongoing maintenance as Mermaid evolves.

### 2. Keep the same public function signatures, make them async

```ts
// Before (sync)
export function parseMermaidSequence(text: string): ParsedSequence

// After (async)
export async function parseMermaidSequence(text: string): Promise<ParsedSequence>
```

Callers (`MermaidImportDialog`) already live inside event handlers — switching them to `await` is a minimal change.

### 3. Walk the AST with a typed visitor per diagram type

Each parser function:
1. Calls `parse(diagramType, text)` from `@mermaid-js/parser`
2. Walks the returned AST nodes
3. Maps AST node types to the app's internal `DiagramNodeBase` / `DiagramEdgeBase` / `SequenceParticipant` / `SequenceMessage` shapes
4. Skips unsupported node types (e.g., `subgraph`, `note`, `loop`, `alt`) and logs a `console.warn`

### 4. `detectMermaidType` remains sync

Type detection only looks at the first non-empty line — no parsing needed. This function stays synchronous.

### 5. Keep `@mermaid-js/parser` as a peer-resolved import

`@mermaid-js/parser` is bundled inside the `mermaid` package (not a separate npm dependency). Import it via the mermaid package's re-export to avoid version drift:
```ts
import { parse } from 'mermaid/dist/diagram-api/...'
```
If the subpath is unstable, fall back to adding `@mermaid-js/parser` explicitly to `package.json` at the same version mermaid uses internally.

## Risks / Trade-offs

- **[Risk] Mermaid's internal parser API may be considered private** → The `@mermaid-js/parser` package is published on npm and listed in mermaid's own package.json as a dependency, so it is stable enough. Pin the mermaid version in package.json to avoid unexpected breakage on upgrade.
- **[Risk] Async parsing may cause a brief loading state in the import dialog** → Mitigation: show a spinner / disable the confirm button while parsing. The parse is fast (< 50ms for typical diagrams).
- **[Risk] AST shape changes between Mermaid major versions** → Mitigation: centralise all AST walking in `mermaid-parser.ts` so any future adaptation is in one file.
- **[Trade-off] C4 diagrams are not natively supported by `@mermaid-js/parser`** → C4 in Mermaid is implemented as a custom plugin. Keep the existing regex parser for C4 only; replace flowchart and sequence parsers with AST-based ones.

## Migration Plan

1. Update `src/lib/mermaid-parser.ts`: replace flowchart + sequence parsers with AST-based implementations; keep C4 regex parser.
2. Update `src/components/MermaidImportDialog.tsx`: await the now-async parse calls; add loading state.
3. Update `src/lib/mermaid-parser.test.ts`: make test helpers async.
4. Verify existing import flows work end-to-end in the browser.
5. No data migration needed — parsing only affects the import path, not stored diagram data.

## Open Questions

- Should `@mermaid-js/parser` be added explicitly to `package.json` devDependencies, or relied on as a transitive dep from `mermaid`? (Prefer explicit to avoid phantom-dep lint warnings.)
