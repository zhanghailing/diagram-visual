## 1. Dependency Setup

- [x] 1.1 Verify `@mermaid-js/parser` is accessible from the installed `mermaid` package (check `node_modules/mermaid/node_modules` or root `node_modules`)
- [x] 1.2 Add `@mermaid-js/parser` explicitly to `package.json` dependencies at the version bundled with `mermaid ^11` to avoid phantom-dep warnings

## 2. Flowchart Parser — AST Implementation

- [x] 2.1 In `src/lib/mermaid-parser.ts`, import `parse` from `@mermaid-js/parser`
- [x] 2.2 Rewrite `parseMermaidFlowchart` as an `async` function that calls `parse('flowchart', text)` and walks the returned AST to extract nodes and edges
- [x] 2.3 Map all AST edge types (`arrow`, `open`, `circle`, `cross`, dotted variants) to `DiagramEdgeBase`; extract edge labels from AST `label` field
- [x] 2.4 Skip `subgraph` AST nodes with a `console.warn` and continue processing remaining nodes/edges
- [x] 2.5 Catch `ParseError` from `@mermaid-js/parser` and re-throw as a typed `MermaidParseError` with a human-readable message

## 3. Sequence Diagram Parser — AST Implementation

- [x] 3.1 Rewrite `parseMermaidSequence` as an `async` function that calls `parse('sequenceDiagram', text)`
- [x] 3.2 Walk the AST to collect participants: handle both `participant` and `actor` statement types; extract alias labels
- [x] 3.3 Walk the AST to collect messages: map all arrow AST types to `SequenceMessage`; extract `from`, `to`, and `label` fields
- [x] 3.4 Skip `loop`, `alt`, `par`, `rect`, and `note` AST blocks with a `console.warn`; continue processing messages outside those blocks
- [x] 3.5 Strip `%%` comment lines before passing to the parser (or confirm the parser handles them natively)

## 4. C4 Parser — Keep Regex, No Change

- [x] 4.1 Leave `parseMermaidC4` as-is (regex-based); add a code comment explaining C4 is not supported by `@mermaid-js/parser`

## 5. Type Detection — No Change

- [x] 5.1 Leave `detectMermaidType` synchronous and unchanged

## 6. Import Dialog — Async Update

- [x] 6.1 In `src/components/MermaidImportDialog.tsx`, update the parse call sites to `await parseMermaidFlowchart(...)` and `await parseMermaidSequence(...)`
- [x] 6.2 Add a loading state (boolean) while parsing is in-flight; disable the confirm button and show a spinner
- [x] 6.3 Catch `MermaidParseError` and display the error message in the dialog UI without closing it

## 7. Tests — Update for Async

- [x] 7.1 In `src/lib/mermaid-parser.test.ts`, convert all `parseMermaidFlowchart` and `parseMermaidSequence` test calls to `await`
- [x] 7.2 Add test cases for new syntax: `--o`, `--x` edges in flowcharts; `actor` keyword and `%% comment` in sequence diagrams
- [x] 7.3 Add test cases for parse error handling: verify `MermaidParseError` is thrown on invalid syntax
- [x] 7.4 Verify all existing test cases still pass with the new AST-based implementation
