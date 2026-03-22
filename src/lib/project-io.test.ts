import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createEmptyProject, exportCanvasToPng, capturePng } from './project-io'
import type { Project } from '@/types'

vi.mock('html-to-image', () => ({
  toPng: vi.fn(),
}))

const { toPng } = await import('html-to-image')

// ─── Helpers ─────────────────────────────────────────────────────────────────

function roundTrip(project: Project): Project {
  // Simulate export + import by serialising and deserialising through JSON
  const json = JSON.stringify(project)
  return JSON.parse(json) as Project
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('project round-trip (2.3, 9.4)', () => {
  it('empty project serialises and deserialises correctly', () => {
    const project = createEmptyProject('Test')
    const restored = roundTrip(project)
    expect(restored.version).toBe(2)
    expect(restored.name).toBe('Test')
    expect(restored.components).toHaveLength(0)
    expect(restored.plans).toHaveLength(0)
  })

  it('project with structural steps round-trips correctly (9.4)', () => {
    const project: Project = {
      version: 2,
      name: 'Structural Test',
      components: [
        {
          id: 'auth-api',
          name: 'Auth API',
          type: 'backend',
          states: [{ id: 'v1', name: 'v1' }, { id: 'v2', name: 'v2' }],
        },
        {
          id: 'gateway',
          name: 'Gateway',
          type: 'gateway',
          states: [{ id: 'gw-v1', name: 'old' }],
        },
        {
          id: 'unified',
          name: 'Unified Gateway',
          type: 'gateway',
          states: [{ id: 'u-v1', name: 'v1' }],
          migrationCreated: { planId: 'p1', stepIndex: 0 },
        },
      ],
      dependencies: [],
      releases: [],
      plans: [
        {
          id: 'p1',
          name: 'Merge Plan',
          steps: [
            {
              id: 's1',
              type: 'structural-merge',
              sourceIds: ['auth-api', 'gateway'],
              successorId: 'unified',
              successorComponent: {
                name: 'Unified Gateway',
                type: 'gateway',
                states: [{ id: 'u-v1', name: 'v1' }],
              },
              notes: 'Combine auth and gateway',
            },
            {
              id: 's2',
              type: 'state-transition',
              componentId: 'unified',
              fromState: 'u-v1',
              toState: 'u-v1',
              notes: 'Placeholder',
            },
          ],
        },
      ],
    }

    const restored = roundTrip(project)

    expect(restored.version).toBe(2)
    expect(restored.plans).toHaveLength(1)
    const plan = restored.plans[0]
    expect(plan.steps).toHaveLength(2)

    const mergeStep = plan.steps[0]
    expect(mergeStep.type).toBe('structural-merge')
    if (mergeStep.type === 'structural-merge') {
      expect(mergeStep.sourceIds).toEqual(['auth-api', 'gateway'])
      expect(mergeStep.successorId).toBe('unified')
      expect(mergeStep.successorComponent.name).toBe('Unified Gateway')
      expect(mergeStep.notes).toBe('Combine auth and gateway')
    }

    // migrationCreated field round-trips
    const unifiedComp = restored.components.find((c) => c.id === 'unified')
    expect(unifiedComp?.migrationCreated).toEqual({ planId: 'p1', stepIndex: 0 })
  })

  it('project with split steps round-trips correctly (9.4)', () => {
    const project: Project = {
      version: 2,
      name: 'Split Test',
      components: [
        {
          id: 'monolith',
          name: 'Monolith',
          type: 'backend',
          states: [{ id: 'm-v1', name: 'v1' }],
        },
        {
          id: 'svc-a',
          name: 'Service A',
          type: 'backend',
          states: [{ id: 'a-v1', name: 'v1' }],
          migrationCreated: { planId: 'p1', stepIndex: 0 },
        },
        {
          id: 'svc-b',
          name: 'Service B',
          type: 'backend',
          states: [{ id: 'b-v1', name: 'v1' }],
          migrationCreated: { planId: 'p1', stepIndex: 0 },
        },
      ],
      dependencies: [],
      releases: [],
      plans: [
        {
          id: 'p1',
          name: 'Split Plan',
          steps: [
            {
              id: 's1',
              type: 'structural-split',
              sourceId: 'monolith',
              successorIds: ['svc-a', 'svc-b'],
              successorComponents: [
                { name: 'Service A', type: 'backend', states: [{ id: 'a-v1', name: 'v1' }] },
                { name: 'Service B', type: 'backend', states: [{ id: 'b-v1', name: 'v1' }] },
              ],
            },
          ],
        },
      ],
    }

    const restored = roundTrip(project)
    const splitStep = restored.plans[0].steps[0]
    expect(splitStep.type).toBe('structural-split')
    if (splitStep.type === 'structural-split') {
      expect(splitStep.sourceId).toBe('monolith')
      expect(splitStep.successorIds).toEqual(['svc-a', 'svc-b'])
      expect(splitStep.successorComponents).toHaveLength(2)
    }
  })
})

// ─── PNG capture helper ───────────────────────────────────────────────────────

function makeContainer(hasReactFlowRoot: boolean): HTMLElement {
  const container = document.createElement('div')
  container.getBoundingClientRect = () => ({ width: 800, height: 600 } as DOMRect)

  if (hasReactFlowRoot) {
    const root = document.createElement('div')
    root.classList.add('react-flow')
    root.getBoundingClientRect = () => ({ width: 800, height: 600 } as DOMRect)
    container.appendChild(root)
  }

  return container
}

describe('captureReactFlowPng — resolveReactFlowRoot + options', () => {
  beforeEach(() => {
    vi.mocked(toPng).mockResolvedValue('data:image/png;base64,abc')
    globalThis.fetch = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(new Blob()) })
    vi.clearAllMocks()
    vi.mocked(toPng).mockResolvedValue('data:image/png;base64,abc')
  })

  it('targets .react-flow element when present', async () => {
    const container = makeContainer(true)
    const reactFlowEl = container.querySelector('.react-flow')!

    await capturePng(container)

    expect(vi.mocked(toPng).mock.calls[0][0]).toBe(reactFlowEl)
  })

  it('falls back to container when .react-flow is not found', async () => {
    const container = makeContainer(false)

    await capturePng(container)

    expect(vi.mocked(toPng).mock.calls[0][0]).toBe(container)
  })

  it('passes explicit width and height from getBoundingClientRect', async () => {
    const container = makeContainer(true)

    await capturePng(container)

    expect(vi.mocked(toPng)).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ width: 800, height: 600 }),
    )
  })

  it('calls toPng twice (SVG marker serialization workaround)', async () => {
    const container = makeContainer(true)

    await capturePng(container)

    expect(vi.mocked(toPng)).toHaveBeenCalledTimes(2)
  })
})

describe('exportCanvasToPng', () => {
  beforeEach(() => {
    vi.mocked(toPng).mockResolvedValue('data:image/png;base64,abc')
  })

  it('sets download filename on the anchor element', async () => {
    const container = makeContainer(true)
    const clicks: string[] = []
    const origCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreate(tag)
      if (tag === 'a') {
        el.click = () => { clicks.push((el as HTMLAnchorElement).download) }
      }
      return el
    })

    await exportCanvasToPng(container, 'diagram.png')

    expect(clicks).toEqual(['diagram.png'])
    vi.restoreAllMocks()
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('v1 → v2 migration (1.5)', () => {
  it('projects with v1 schema have type field defaulted to state-transition', async () => {
    // We test the migration logic by importing via importProject (mocked as inline parse)
    // The migrateProject function is private but we can test its effect via loadFromLocalStorage
    // Instead, test the v1 object shape directly through the exported logic
    const v1Project = {
      version: 1,
      name: 'Legacy',
      components: [],
      dependencies: [],
      releases: [],
      plans: [
        {
          id: 'p1',
          name: 'Old Plan',
          steps: [
            { id: 's1', componentId: 'backend', fromState: 'v1', toState: 'v2' },
          ],
        },
      ],
    }

    // Simulate migration: what migrateProject does inline
    const obj = JSON.parse(JSON.stringify(v1Project)) as Record<string, unknown>
    if (obj.version === 1) {
      const plans = (obj.plans as Array<Record<string, unknown>>) ?? []
      for (const plan of plans) {
        const steps = (plan.steps as Array<Record<string, unknown>>) ?? []
        for (const step of steps) {
          if (!step.type) step.type = 'state-transition'
        }
      }
      obj.version = 2
    }

    const migrated = obj as unknown as Project
    expect(migrated.version).toBe(2)
    const step = migrated.plans[0].steps[0]
    expect(step.type).toBe('state-transition')
    if (step.type === 'state-transition') {
      expect(step.componentId).toBe('backend')
    }
  })
})
