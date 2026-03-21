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

const components = [backend, frontend]

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

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('simulatePlan', () => {
  it('returns feasible for an empty plan', () => {
    const result = simulatePlan(makePlan([]), [], components)
    expect(result.feasible).toBe(true)
    expect(result.steps).toHaveLength(0)
  })

  it('returns feasible when there are no dependency edges', () => {
    const plan = makePlan([
      { id: 's1', componentId: 'frontend', fromState: 'old', toState: 'new' },
    ])
    const result = simulatePlan(plan, [], components)
    expect(result.feasible).toBe(true)
    expect(result.steps[0].status).toBe('ok')
  })

  it('is feasible when dependency is satisfied before the blocked step', () => {
    const plan = makePlan([
      { id: 's1', componentId: 'backend', fromState: 'v1', toState: 'v1v2' },
      { id: 's2', componentId: 'frontend', fromState: 'old', toState: 'new' },
    ])
    const result = simulatePlan(plan, [dep], components)
    expect(result.feasible).toBe(true)
    expect(result.steps[0].status).toBe('ok')
    expect(result.steps[1].status).toBe('ok')
  })

  it('detects a violation when dependency is not yet satisfied', () => {
    const plan = makePlan([
      { id: 's1', componentId: 'frontend', fromState: 'old', toState: 'new' },
      { id: 's2', componentId: 'backend', fromState: 'v1', toState: 'v1v2' },
    ])
    const result = simulatePlan(plan, [dep], components)
    expect(result.feasible).toBe(false)
    expect(result.steps[0].status).toBe('violation')
    expect(result.steps[0].reason).toMatch(/Backend/)
  })

  it('marks all steps after the first violation as unvalidated', () => {
    const plan = makePlan([
      { id: 's1', componentId: 'frontend', fromState: 'old', toState: 'new' }, // violation
      { id: 's2', componentId: 'backend', fromState: 'v1', toState: 'v1v2' }, // unvalidated
      { id: 's3', componentId: 'backend', fromState: 'v1v2', toState: 'v2' }, // unvalidated
    ])
    const result = simulatePlan(plan, [dep], components)
    expect(result.steps[0].status).toBe('violation')
    expect(result.steps[1].status).toBe('unvalidated')
    expect(result.steps[2].status).toBe('unvalidated')
  })

  it('handles multiple components without dependencies', () => {
    const plan = makePlan([
      { id: 's1', componentId: 'backend', fromState: 'v1', toState: 'v1v2' },
      { id: 's2', componentId: 'backend', fromState: 'v1v2', toState: 'v2' },
    ])
    const result = simulatePlan(plan, [], components)
    expect(result.feasible).toBe(true)
    expect(result.steps.every((s) => s.status === 'ok')).toBe(true)
  })
})
