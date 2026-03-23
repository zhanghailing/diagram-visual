import { describe, it, expect } from 'vitest'
import {
  parseMermaidFlowchart,
  parseMermaidC4,
  parseMermaidSequence,
  MermaidParseError,
} from './mermaid-parser'

// ─── parseMermaidFlowchart ────────────────────────────────────────────────────

describe('parseMermaidFlowchart', () => {
  it('parses a simple flowchart with labeled nodes and edges', async () => {
    const text = `flowchart LR
  A[Frontend] --> B[API Gateway]
  B --> C[Auth Service]`
    const { nodes, edges } = await parseMermaidFlowchart(text)
    expect(nodes).toHaveLength(3)
    expect(nodes.map((n) => n.label)).toEqual(
      expect.arrayContaining(['Frontend', 'API Gateway', 'Auth Service']),
    )
    expect(edges).toHaveLength(2)
    expect(nodes.every((n) => n.nodeType === 'box')).toBe(true)
    expect(nodes.every((n) => typeof n.id === 'string' && n.id.length > 0)).toBe(true)
  })

  it('parses a graph TD directive', async () => {
    const text = `graph TD
  X --> Y`
    const { nodes, edges } = await parseMermaidFlowchart(text)
    expect(nodes).toHaveLength(2)
    expect(edges).toHaveLength(1)
  })

  it('handles edge labels', async () => {
    const text = `flowchart LR
  A -->|calls| B`
    const { edges } = await parseMermaidFlowchart(text)
    expect(edges[0].label).toBe('calls')
  })

  it('throws MermaidParseError for unsupported first line', async () => {
    await expect(parseMermaidFlowchart('sequenceDiagram\nA ->> B: hi')).rejects.toBeInstanceOf(MermaidParseError)
  })

  it('handles empty body gracefully', async () => {
    const { nodes, edges } = await parseMermaidFlowchart('flowchart LR')
    expect(nodes).toHaveLength(0)
    expect(edges).toHaveLength(0)
  })

  it('imports circle arrow --o edges', async () => {
    const text = `flowchart LR
  A --o B`
    const { nodes, edges } = await parseMermaidFlowchart(text)
    expect(nodes).toHaveLength(2)
    expect(edges).toHaveLength(1)
  })

  it('imports cross arrow --x edges', async () => {
    const text = `flowchart LR
  A --x B`
    const { nodes, edges } = await parseMermaidFlowchart(text)
    expect(nodes).toHaveLength(2)
    expect(edges).toHaveLength(1)
  })

  it('throws MermaidParseError on invalid syntax', async () => {
    await expect(parseMermaidFlowchart('flowchart LR\nA --[ B')).rejects.toBeInstanceOf(MermaidParseError)
  })
})

// ─── parseMermaidC4 ───────────────────────────────────────────────────────────

describe('parseMermaidC4', () => {
  it('parses persons, systems, containers, and components', () => {
    const text = `C4Component
  Person(user, "End User", "A user")
  System(webapp, "Web App", "The frontend")
  Container(api, "API", "REST API")
  Component(auth, "Auth Module", "Handles auth")
  Rel(user, webapp, "Uses", "HTTPS")
  Rel(webapp, api, "Calls", "REST")`
    const { nodes, edges } = parseMermaidC4(text)
    expect(nodes).toHaveLength(4)
    expect(nodes.find((n) => n.nodeType === 'c4-person')?.label).toBe('End User')
    expect(nodes.find((n) => n.nodeType === 'c4-system')?.label).toBe('Web App')
    expect(nodes.find((n) => n.nodeType === 'c4-container')?.label).toBe('API')
    expect(nodes.find((n) => n.nodeType === 'c4-component')?.label).toBe('Auth Module')
    expect(edges).toHaveLength(2)
    expect(edges[0].label).toBe('Uses')
    expect(edges[0].technology).toBe('HTTPS')
  })

  it('throws for unsupported first line', () => {
    expect(() => parseMermaidC4('flowchart LR\nA --> B')).toThrow()
  })

  it('handles C4Context directive', () => {
    const text = `C4Context
  Person(u, "User")`
    const { nodes } = parseMermaidC4(text)
    expect(nodes).toHaveLength(1)
  })
})

// ─── parseMermaidSequence ─────────────────────────────────────────────────────

describe('parseMermaidSequence', () => {
  it('parses participants and messages', async () => {
    const text = `sequenceDiagram
  participant A as Client
  participant B as Gateway
  A ->> B: Request
  B -->> A: Response`
    const { participants, messages } = await parseMermaidSequence(text)
    expect(participants).toHaveLength(2)
    expect(participants[0].label).toBe('Client')
    expect(participants[1].label).toBe('Gateway')
    expect(messages).toHaveLength(2)
    expect(messages[0].label).toBe('Request')
    expect(messages[1].label).toBe('Response')
  })

  it('infers participants from messages when not declared', async () => {
    const text = `sequenceDiagram
  X ->> Y: ping`
    const { participants } = await parseMermaidSequence(text)
    expect(participants).toHaveLength(2)
  })

  it('preserves participant order from declaration', async () => {
    const text = `sequenceDiagram
  participant C
  participant A
  participant B
  C ->> A: hello`
    const { participants } = await parseMermaidSequence(text)
    expect(participants.map((p) => p.label)).toEqual(['C', 'A', 'B'])
  })

  it('throws MermaidParseError for unsupported first line', async () => {
    await expect(parseMermaidSequence('flowchart LR\nA --> B')).rejects.toBeInstanceOf(MermaidParseError)
  })

  it('handles actor keyword like participant', async () => {
    const text = `sequenceDiagram
  actor Alice
  actor Bob
  Alice ->> Bob: Hello`
    const { participants, messages } = await parseMermaidSequence(text)
    expect(participants.map((p) => p.label)).toContain('Alice')
    expect(participants.map((p) => p.label)).toContain('Bob')
    expect(messages).toHaveLength(1)
  })

  it('ignores %% comment lines', async () => {
    const text = `sequenceDiagram
  %% this is a comment
  participant A
  participant B
  A ->> B: ping`
    const { participants, messages } = await parseMermaidSequence(text)
    expect(participants).toHaveLength(2)
    expect(messages).toHaveLength(1)
  })

  it('imports messages with -->> dotted arrow', async () => {
    const text = `sequenceDiagram
  A -->> B: response`
    const { messages } = await parseMermaidSequence(text)
    expect(messages).toHaveLength(1)
    expect(messages[0].label).toBe('response')
  })

  it('throws MermaidParseError for wrong first line', async () => {
    await expect(parseMermaidSequence('notADiagram\n>>>')).rejects.toBeInstanceOf(MermaidParseError)
  })
})
