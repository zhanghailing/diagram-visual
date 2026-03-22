import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useStore } from './index'
import type { Diagram } from '@/types'

// Prevent real localStorage writes during tests
vi.mock('@/lib/project-io', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/project-io')>()
  return { ...original, saveToLocalStorage: vi.fn(), loadFromLocalStorage: vi.fn(() => null) }
})

function makeDiagram(overrides?: Partial<Diagram>): Diagram {
  return {
    id: 'diag1',
    name: 'Test',
    type: 'architecture',
    baseNodes: [],
    baseEdges: [],
    phases: {},
    ...overrides,
  }
}

describe('addDiagramPhase', () => {
  beforeEach(() => {
    useStore.setState((s) => ({
      project: { ...s.project, diagrams: [makeDiagram()] },
    }))
  })

  it('appends a new phase with the given label', () => {
    useStore.getState().addDiagramPhase('diag1', 'My Phase')
    const diagram = useStore.getState().project.diagrams?.find((d) => d.id === 'diag1')
    const order = diagram?.phaseOrder ?? []
    expect(order[order.length - 1]?.label).toBe('My Phase')
  })

  it('initialises phaseOrder from default when absent', () => {
    useStore.getState().addDiagramPhase('diag1', 'Extra')
    const diagram = useStore.getState().project.diagrams?.find((d) => d.id === 'diag1')
    // Default 3 phases + 1 added = 4
    expect(diagram?.phaseOrder).toHaveLength(4)
    expect(diagram?.phaseOrder?.[0].id).toBe('as-is')
  })

  it('generated phase IDs are unique', () => {
    useStore.getState().addDiagramPhase('diag1', 'A')
    useStore.getState().addDiagramPhase('diag1', 'B')
    const diagram = useStore.getState().project.diagrams?.find((d) => d.id === 'diag1')
    const ids = diagram?.phaseOrder?.map((p) => p.id) ?? []
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('deleteDiagramPhase', () => {
  beforeEach(() => {
    useStore.setState((s) => ({
      project: {
        ...s.project,
        diagrams: [
          makeDiagram({
            phaseOrder: [
              { id: 'p0', label: 'Base' },
              { id: 'p1', label: 'Step 1' },
              { id: 'p2', label: 'Step 2' },
            ],
            phases: {
              p1: { addedNodes: [], addedEdges: [], nodeOverrides: [], edgeOverrides: [] },
            },
          }),
        ],
      },
    }))
  })

  it('removes a non-base phase from phaseOrder', () => {
    useStore.getState().deleteDiagramPhase('diag1', 'p1')
    const diagram = useStore.getState().project.diagrams?.find((d) => d.id === 'diag1')
    expect(diagram?.phaseOrder?.map((p) => p.id)).not.toContain('p1')
  })

  it('removes the phase override data', () => {
    useStore.getState().deleteDiagramPhase('diag1', 'p1')
    const diagram = useStore.getState().project.diagrams?.find((d) => d.id === 'diag1')
    expect(diagram?.phases['p1']).toBeUndefined()
  })

  it('is a no-op on the first (base) phase', () => {
    useStore.getState().deleteDiagramPhase('diag1', 'p0')
    const diagram = useStore.getState().project.diagrams?.find((d) => d.id === 'diag1')
    expect(diagram?.phaseOrder?.map((p) => p.id)).toContain('p0')
    expect(diagram?.phaseOrder).toHaveLength(3)
  })
})
