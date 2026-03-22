import { describe, it, expect } from 'vitest'
import { simulatePlanUpTo } from './plan-simulation'
import type { Component, MigrationPlan } from '@/types'

// ─── Test fixtures ────────────────────────────────────────────────────────────

const authApi: Component = {
  id: 'auth-api',
  name: 'Auth API',
  type: 'backend',
  states: [
    { id: 'auth-v1', name: 'v1' },
    { id: 'auth-v2', name: 'v2' },
  ],
}

const gateway: Component = {
  id: 'gateway',
  name: 'Gateway',
  type: 'gateway',
  states: [
    { id: 'gw-old', name: 'old' },
    { id: 'gw-new', name: 'new' },
  ],
}

const unifiedGateway: Component = {
  id: 'unified-gw',
  name: 'Unified Gateway',
  type: 'gateway',
  states: [
    { id: 'ugw-v1', name: 'v1' },
    { id: 'ugw-v2', name: 'v2' },
  ],
  migrationCreated: { planId: 'p1', stepIndex: 0 },
}

const frontend: Component = {
  id: 'frontend',
  name: 'Frontend',
  type: 'frontend',
  states: [
    { id: 'fe-old', name: 'old' },
    { id: 'fe-new', name: 'new' },
  ],
}

const splitA: Component = {
  id: 'split-a',
  name: 'Service A',
  type: 'backend',
  states: [{ id: 'sa-v1', name: 'v1' }, { id: 'sa-v2', name: 'v2' }],
  migrationCreated: { planId: 'p1', stepIndex: 0 },
}

const splitB: Component = {
  id: 'split-b',
  name: 'Service B',
  type: 'backend',
  states: [{ id: 'sb-v1', name: 'v1' }, { id: 'sb-v2', name: 'v2' }],
  migrationCreated: { planId: 'p1', stepIndex: 0 },
}

const allComponents = [authApi, gateway, unifiedGateway, frontend, splitA, splitB]

function makePlan(steps: MigrationPlan['steps']): MigrationPlan {
  return { id: 'p1', name: 'Test Plan', steps }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('simulatePlanUpTo', () => {
  it('returns all original components active for empty plan', () => {
    const result = simulatePlanUpTo(makePlan([]), [authApi, gateway], -1)
    expect(result.active.has('auth-api')).toBe(true)
    expect(result.active.has('gateway')).toBe(true)
    expect(result.retired.size).toBe(0)
    expect(result.successorMap.size).toBe(0)
  })

  it('state-transition steps do not change lifecycle', () => {
    const plan = makePlan([
      { id: 's1', type: 'state-transition', componentId: 'auth-api', fromState: 'auth-v1', toState: 'auth-v2' },
    ])
    const result = simulatePlanUpTo(plan, [authApi, gateway], 0)
    expect(result.active.has('auth-api')).toBe(true)
    expect(result.active.has('gateway')).toBe(true)
    expect(result.retired.size).toBe(0)
  })

  it('structural-merge retires sources and activates successor', () => {
    const plan = makePlan([
      {
        id: 'merge1',
        type: 'structural-merge',
        sourceIds: ['auth-api', 'gateway'],
        successorId: 'unified-gw',
        successorComponent: { name: 'Unified Gateway', type: 'gateway', states: unifiedGateway.states },
      },
    ])
    const result = simulatePlanUpTo(plan, [authApi, gateway, unifiedGateway], 0)
    expect(result.active.has('auth-api')).toBe(false)
    expect(result.active.has('gateway')).toBe(false)
    expect(result.active.has('unified-gw')).toBe(true)
    expect(result.retired.has('auth-api')).toBe(true)
    expect(result.retired.has('gateway')).toBe(true)
    expect(result.successorMap.get('auth-api')).toBe('unified-gw')
    expect(result.successorMap.get('gateway')).toBe('unified-gw')
  })

  it('structural-split retires source and activates all successors', () => {
    const plan = makePlan([
      {
        id: 'split1',
        type: 'structural-split',
        sourceId: 'auth-api',
        successorIds: ['split-a', 'split-b'],
        successorComponents: [
          { name: 'Service A', type: 'backend', states: splitA.states },
          { name: 'Service B', type: 'backend', states: splitB.states },
        ],
      },
    ])
    const result = simulatePlanUpTo(plan, [authApi, splitA, splitB], 0)
    expect(result.active.has('auth-api')).toBe(false)
    expect(result.active.has('split-a')).toBe(true)
    expect(result.active.has('split-b')).toBe(true)
    expect(result.retired.has('auth-api')).toBe(true)
    expect(result.successorMap.get('auth-api')).toEqual(['split-a', 'split-b'])
  })

  it('respects stepIndex — does not apply steps beyond index', () => {
    const plan = makePlan([
      {
        id: 's1',
        type: 'state-transition',
        componentId: 'frontend',
        fromState: 'fe-old',
        toState: 'fe-new',
      },
      {
        id: 'merge1',
        type: 'structural-merge',
        sourceIds: ['auth-api', 'gateway'],
        successorId: 'unified-gw',
        successorComponent: { name: 'Unified Gateway', type: 'gateway', states: unifiedGateway.states },
      },
    ])
    // After step 0 (state-transition): merge not yet applied
    const beforeMerge = simulatePlanUpTo(plan, allComponents, 0)
    expect(beforeMerge.active.has('auth-api')).toBe(true)
    expect(beforeMerge.active.has('gateway')).toBe(true)
    expect(beforeMerge.retired.size).toBe(0)

    // After step 1 (merge): sources retired, successor active
    const afterMerge = simulatePlanUpTo(plan, allComponents, 1)
    expect(afterMerge.active.has('auth-api')).toBe(false)
    expect(afterMerge.active.has('gateway')).toBe(false)
    expect(afterMerge.active.has('unified-gw')).toBe(true)
    expect(afterMerge.retired.has('auth-api')).toBe(true)
  })

  it('handles chained structural steps', () => {
    // Step 0: merge auth-api + gateway → unified-gw
    // Step 1: split unified-gw → split-a, split-b
    const plan = makePlan([
      {
        id: 'merge1',
        type: 'structural-merge',
        sourceIds: ['auth-api', 'gateway'],
        successorId: 'unified-gw',
        successorComponent: { name: 'Unified Gateway', type: 'gateway', states: unifiedGateway.states },
      },
      {
        id: 'split1',
        type: 'structural-split',
        sourceId: 'unified-gw',
        successorIds: ['split-a', 'split-b'],
        successorComponents: [
          { name: 'Service A', type: 'backend', states: splitA.states },
          { name: 'Service B', type: 'backend', states: splitB.states },
        ],
      },
    ])
    const result = simulatePlanUpTo(plan, allComponents, 1)
    expect(result.active.has('auth-api')).toBe(false)
    expect(result.active.has('gateway')).toBe(false)
    expect(result.active.has('unified-gw')).toBe(false)
    expect(result.active.has('split-a')).toBe(true)
    expect(result.active.has('split-b')).toBe(true)
    expect(result.retired.has('auth-api')).toBe(true)
    expect(result.retired.has('gateway')).toBe(true)
    expect(result.retired.has('unified-gw')).toBe(true)
  })

  it('stepIndex -1 returns initial state', () => {
    const plan = makePlan([
      {
        id: 'merge1',
        type: 'structural-merge',
        sourceIds: ['auth-api', 'gateway'],
        successorId: 'unified-gw',
        successorComponent: { name: 'Unified Gateway', type: 'gateway', states: unifiedGateway.states },
      },
    ])
    const result = simulatePlanUpTo(plan, [authApi, gateway, unifiedGateway], -1)
    expect(result.active.has('auth-api')).toBe(true)
    expect(result.active.has('gateway')).toBe(true)
    expect(result.retired.size).toBe(0)
  })
})
