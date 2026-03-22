import { describe, it, expect } from 'vitest'
import { simulatePlan } from './feasibility'
import type { Component, DependencyEdge, MigrationPlan } from '@/types'

// ─── Test fixtures ────────────────────────────────────────────────────────────

const backend: Component = {
  id: 'backend',
  name: 'Backend',
  type: 'backend',
  states: [
    { id: 'v1', name: 'v1' },
    { id: 'v1v2', name: 'v1+v2 compat' },
    { id: 'v2', name: 'v2-only' },
  ],
}

const frontend: Component = {
  id: 'frontend',
  name: 'Frontend',
  type: 'frontend',
  states: [
    { id: 'old', name: 'uses v1' },
    { id: 'new', name: 'uses v2' },
  ],
}

const unified: Component = {
  id: 'unified',
  name: 'Unified',
  type: 'backend',
  states: [
    { id: 'u-v1', name: 'v1' },
    { id: 'u-v2', name: 'v2' },
  ],
  migrationCreated: { planId: 'p1', stepIndex: 0 },
}

const successor1: Component = {
  id: 'svc-a',
  name: 'Service A',
  type: 'backend',
  states: [{ id: 'a-v1', name: 'v1' }, { id: 'a-v2', name: 'v2' }],
  migrationCreated: { planId: 'p1', stepIndex: 0 },
}

const successor2: Component = {
  id: 'svc-b',
  name: 'Service B',
  type: 'backend',
  states: [{ id: 'b-v1', name: 'v1' }, { id: 'b-v2', name: 'v2' }],
  migrationCreated: { planId: 'p1', stepIndex: 0 },
}

const components = [backend, frontend]
const allComponents = [backend, frontend, unified, successor1, successor2]

// Dependency: frontend can only go to "new" if backend is at "v1v2" (index 1)
const dep: DependencyEdge = {
  id: 'dep1',
  from: 'backend',
  fromState: 'v1v2',
  to: 'frontend',
  toState: 'new',
}

function makePlan(steps: MigrationPlan['steps']): MigrationPlan {
  return { id: 'p1', name: 'Test Plan', steps }
}

// ─── Existing tests (backwards compatibility) ─────────────────────────────────

describe('simulatePlan — state-transition (regression)', () => {
  it('returns feasible for an empty plan', () => {
    const result = simulatePlan(makePlan([]), [], components)
    expect(result.feasible).toBe(true)
    expect(result.steps).toHaveLength(0)
  })

  it('returns feasible when there are no dependency edges', () => {
    const plan = makePlan([
      { id: 's1', type: 'state-transition', componentId: 'frontend', fromState: 'old', toState: 'new' },
    ])
    const result = simulatePlan(plan, [], components)
    expect(result.feasible).toBe(true)
    expect(result.steps[0].status).toBe('ok')
  })

  it('is feasible when dependency is satisfied before the blocked step', () => {
    const plan = makePlan([
      { id: 's1', type: 'state-transition', componentId: 'backend', fromState: 'v1', toState: 'v1v2' },
      { id: 's2', type: 'state-transition', componentId: 'frontend', fromState: 'old', toState: 'new' },
    ])
    const result = simulatePlan(plan, [dep], components)
    expect(result.feasible).toBe(true)
    expect(result.steps[0].status).toBe('ok')
    expect(result.steps[1].status).toBe('ok')
  })

  it('detects a violation when dependency is not yet satisfied', () => {
    const plan = makePlan([
      { id: 's1', type: 'state-transition', componentId: 'frontend', fromState: 'old', toState: 'new' },
      { id: 's2', type: 'state-transition', componentId: 'backend', fromState: 'v1', toState: 'v1v2' },
    ])
    const result = simulatePlan(plan, [dep], components)
    expect(result.feasible).toBe(false)
    expect(result.steps[0].status).toBe('violation')
    expect(result.steps[0].reason).toMatch(/Backend/)
  })

  it('marks all steps after the first violation as unvalidated', () => {
    const plan = makePlan([
      { id: 's1', type: 'state-transition', componentId: 'frontend', fromState: 'old', toState: 'new' }, // violation
      { id: 's2', type: 'state-transition', componentId: 'backend', fromState: 'v1', toState: 'v1v2' }, // unvalidated
      { id: 's3', type: 'state-transition', componentId: 'backend', fromState: 'v1v2', toState: 'v2' }, // unvalidated
    ])
    const result = simulatePlan(plan, [dep], components)
    expect(result.steps[0].status).toBe('violation')
    expect(result.steps[1].status).toBe('unvalidated')
    expect(result.steps[2].status).toBe('unvalidated')
  })

  it('handles multiple components without dependencies', () => {
    const plan = makePlan([
      { id: 's1', type: 'state-transition', componentId: 'backend', fromState: 'v1', toState: 'v1v2' },
      { id: 's2', type: 'state-transition', componentId: 'backend', fromState: 'v1v2', toState: 'v2' },
    ])
    const result = simulatePlan(plan, [], components)
    expect(result.feasible).toBe(true)
    expect(result.steps.every((s) => s.status === 'ok')).toBe(true)
  })
})

// ─── Retirement constraint tests (4.5) ────────────────────────────────────────

describe('simulatePlan — retirement constraints', () => {
  it('valid structural-merge step passes when no dependents', () => {
    const plan = makePlan([
      {
        id: 'merge1',
        type: 'structural-merge',
        sourceIds: ['backend', 'frontend'],
        successorId: 'unified',
        successorComponent: { name: 'Unified', type: 'backend', states: unified.states },
      },
    ])
    const result = simulatePlan(plan, [], allComponents)
    expect(result.feasible).toBe(true)
    expect(result.steps[0].status).toBe('ok')
  })

  it('detects violation when state-transition targets a retired component (4.1)', () => {
    const plan = makePlan([
      {
        id: 'merge1',
        type: 'structural-merge',
        sourceIds: ['backend', 'frontend'],
        successorId: 'unified',
        successorComponent: { name: 'Unified', type: 'backend', states: unified.states },
      },
      // Backend has been retired by the merge; this step should be a violation
      {
        id: 's2',
        type: 'state-transition',
        componentId: 'backend',
        fromState: 'v1',
        toState: 'v1v2',
      },
    ])
    const result = simulatePlan(plan, [], allComponents)
    expect(result.feasible).toBe(false)
    expect(result.steps[0].status).toBe('ok')
    expect(result.steps[1].status).toBe('violation')
    expect(result.steps[1].reason).toMatch(/retired/)
    expect(result.steps[1].reason).toMatch(/Backend/)
  })

  it('detects violation when merge step has unresolved dependent (4.2)', () => {
    // frontend depends on backend (dep edge from 'backend' v1v2 → frontend 'new')
    // If we merge backend into unified before frontend has resolved its dependency, it's a violation
    const plan = makePlan([
      {
        id: 'merge1',
        type: 'structural-merge',
        sourceIds: ['backend'],
        successorId: 'unified',
        successorComponent: { name: 'Unified', type: 'backend', states: unified.states },
      },
    ])
    // dep: backend (v1v2) must be reached before frontend can go 'new'
    // but frontend is still at 'old' (hasn't made that transition) → unresolved
    const result = simulatePlan(plan, [dep], allComponents)
    expect(result.feasible).toBe(false)
    expect(result.steps[0].status).toBe('violation')
    expect(result.steps[0].reason).toMatch(/Frontend/)
    expect(result.steps[0].reason).toMatch(/Backend/)
  })

  it('merge passes when dependent has already resolved its dependency (4.2)', () => {
    // frontend transitions first (satisfying its dep via backend at v1v2),
    // then backend is merged — no unresolved dependents
    const plan = makePlan([
      { id: 's1', type: 'state-transition', componentId: 'backend', fromState: 'v1', toState: 'v1v2' },
      { id: 's2', type: 'state-transition', componentId: 'frontend', fromState: 'old', toState: 'new' },
      {
        id: 'merge1',
        type: 'structural-merge',
        sourceIds: ['backend'],
        successorId: 'unified',
        successorComponent: { name: 'Unified', type: 'backend', states: unified.states },
      },
    ])
    const result = simulatePlan(plan, [dep], allComponents)
    expect(result.feasible).toBe(true)
    expect(result.steps.every((s) => s.status === 'ok')).toBe(true)
  })

  it('valid structural-split step passes when no dependents', () => {
    const plan = makePlan([
      {
        id: 'split1',
        type: 'structural-split',
        sourceId: 'backend',
        successorIds: ['svc-a', 'svc-b'],
        successorComponents: [
          { name: 'Service A', type: 'backend', states: successor1.states },
          { name: 'Service B', type: 'backend', states: successor2.states },
        ],
      },
    ])
    const result = simulatePlan(plan, [], allComponents)
    expect(result.feasible).toBe(true)
    expect(result.steps[0].status).toBe('ok')
  })

  it('detects violation when split step has unresolved dependent', () => {
    // dep: backend (v1v2) must be reached before frontend can go 'new'
    // if we split backend before frontend resolves → violation
    const plan = makePlan([
      {
        id: 'split1',
        type: 'structural-split',
        sourceId: 'backend',
        successorIds: ['svc-a', 'svc-b'],
        successorComponents: [
          { name: 'Service A', type: 'backend', states: successor1.states },
          { name: 'Service B', type: 'backend', states: successor2.states },
        ],
      },
    ])
    const result = simulatePlan(plan, [dep], allComponents)
    expect(result.feasible).toBe(false)
    expect(result.steps[0].status).toBe('violation')
    expect(result.steps[0].reason).toMatch(/Frontend/)
  })

  it('step after structural merge passes using successor state (edge redirection — 4.3)', () => {
    // We merge backend+frontend → unified
    // Then a state-transition of unified should be ok (not blocked by retired backends)
    const plan = makePlan([
      {
        id: 'merge1',
        type: 'structural-merge',
        sourceIds: ['backend', 'frontend'],
        successorId: 'unified',
        successorComponent: { name: 'Unified', type: 'backend', states: unified.states },
      },
      {
        id: 's2',
        type: 'state-transition',
        componentId: 'unified',
        fromState: 'u-v1',
        toState: 'u-v2',
      },
    ])
    const result = simulatePlan(plan, [], allComponents)
    expect(result.feasible).toBe(true)
    expect(result.steps[0].status).toBe('ok')
    expect(result.steps[1].status).toBe('ok')
  })
})

// ─── Project file round-trip tests (2.3, 9.3, 9.4) ───────────────────────────

describe('simulatePlan — backwards compatibility (9.3)', () => {
  it('plans without structural steps continue to work', () => {
    const plan = makePlan([
      { id: 's1', type: 'state-transition', componentId: 'backend', fromState: 'v1', toState: 'v1v2' },
      { id: 's2', type: 'state-transition', componentId: 'frontend', fromState: 'old', toState: 'new' },
    ])
    const result = simulatePlan(plan, [dep], components)
    expect(result.feasible).toBe(true)
    expect(result.steps).toHaveLength(2)
    expect(result.steps.every((s) => s.status === 'ok')).toBe(true)
  })
})
