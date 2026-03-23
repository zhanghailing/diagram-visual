## Why

The current Mermaid import feature uses hand-written regex parsers that only handle a small subset of Mermaid syntax. As Mermaid has evolved (v10+), new syntax forms—such as updated arrow styles, `%%` comments, `actor` keyword, `box` grouping in sequence diagrams, and extended flowchart edge types—are silently dropped or cause parse failures, misleading users who paste valid Mermaid code.

## What Changes

- Replace the regex-based parsers in `src/lib/mermaid-parser.ts` with Mermaid's own internal parser (available via the already-installed `mermaid` npm package) to extract AST data.
- The existing public API of `mermaid-parser.ts` (`parseMermaidFlowchart`, `parseMermaidSequence`, `parseMermaidC4`, `detectMermaidType`) is preserved so callers are unaffected.
- Mermaid's parser runs in a worker / async context; the import dialog will be updated to handle async parsing.
- Unsupported Mermaid constructs (e.g. subgraphs, `rect`, `note`) will be explicitly skipped with a warning instead of silently lost.

## Capabilities

### New Capabilities

- `mermaid-native-parsing`: Use Mermaid's internal AST parser to accurately parse flowchart, sequence, and C4 diagrams, replacing the fragile regex approach.

### Modified Capabilities

- `mermaid-import`: Parsing backend changes; existing import UX remains the same but now accepts a wider range of valid Mermaid syntax.
- `sequence-mermaid-import`: Sequence diagram import now correctly handles `actor`, `box`, `%%` comments, and modern arrow types (`->>`, `-->>`, `-x`, `-)`, `--x`, `--)`).

## Impact

- **Modified files**: `src/lib/mermaid-parser.ts`, `src/components/MermaidImportDialog.tsx`
- **Dependencies**: Uses the already-installed `mermaid ^11.13.0` package's internal parser API (`mermaid.mermaidAPI` / `@mermaid-js/parser`)
- **Async change**: Parsing becomes async; callers in `MermaidImportDialog` are updated accordingly
- **No breaking changes** to the store, view components, or exported types
