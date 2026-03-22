import type { Project } from '@/types'

/**
 * A realistic demo project: migrating a REST API from v1 to v2
 * across a gateway, backend, and two frontends.
 */
export const DEMO_PROJECT: Project = {
  version: 2,
  name: 'API v2 Migration Demo',
  components: [
    {
      id: 'gateway',
      name: 'API Gateway',
      type: 'gateway',
      states: [
        { id: 'gw-v1', name: 'routes v1 only' },
        { id: 'gw-both', name: 'routes v1 + v2' },
        { id: 'gw-v2', name: 'routes v2 only' },
      ],
    },
    {
      id: 'backend',
      name: 'Backend Service',
      type: 'backend',
      states: [
        { id: 'be-v1', name: 'v1 API only' },
        { id: 'be-compat', name: 'v1 + v2 compat' },
        { id: 'be-v2', name: 'v2 API only' },
      ],
    },
    {
      id: 'frontend-main',
      name: 'Main Frontend',
      type: 'frontend',
      states: [
        { id: 'fe-v1', name: 'calls v1' },
        { id: 'fe-v2', name: 'calls v2' },
      ],
    },
    {
      id: 'frontend-mobile',
      name: 'Mobile App',
      type: 'frontend',
      states: [
        { id: 'mob-v1', name: 'calls v1' },
        { id: 'mob-v2', name: 'calls v2' },
      ],
    },
    {
      id: 'shared-lib',
      name: 'API Client Library',
      type: 'library',
      states: [
        { id: 'lib-v1', name: 'v1 client' },
        { id: 'lib-v2', name: 'v2 client' },
      ],
    },
  ],
  dependencies: [
    // Backend must be compat before gateway can route both
    { id: 'dep1', from: 'backend', fromState: 'be-compat', to: 'gateway', toState: 'gw-both' },
    // Gateway must route v2 before frontends can call v2
    { id: 'dep2', from: 'gateway', fromState: 'gw-both', to: 'frontend-main', toState: 'fe-v2' },
    { id: 'dep3', from: 'gateway', fromState: 'gw-both', to: 'frontend-mobile', toState: 'mob-v2' },
    // Shared lib v2 must be available before frontends adopt it
    { id: 'dep4', from: 'shared-lib', fromState: 'lib-v2', to: 'frontend-main', toState: 'fe-v2' },
    { id: 'dep5', from: 'shared-lib', fromState: 'lib-v2', to: 'frontend-mobile', toState: 'mob-v2' },
    // Backend can only drop v1 after gateway routes v2 only
    { id: 'dep6', from: 'gateway', fromState: 'gw-v2', to: 'backend', toState: 'be-v2' },
  ],
  plans: [
    {
      id: 'plan-correct',
      name: 'Correct Order',
      description: 'Backend first, then library, then gateway, then frontends',
      steps: [
        { id: 'cs1', type: 'state-transition', componentId: 'backend', fromState: 'be-v1', toState: 'be-compat', notes: 'Add v2 endpoints alongside v1' },
        { id: 'cs2', type: 'state-transition', componentId: 'shared-lib', fromState: 'lib-v1', toState: 'lib-v2', notes: 'Release v2 client package' },
        { id: 'cs3', type: 'state-transition', componentId: 'gateway', fromState: 'gw-v1', toState: 'gw-both', notes: 'Enable v2 routing in gateway' },
        { id: 'cs4', type: 'state-transition', componentId: 'frontend-main', fromState: 'fe-v1', toState: 'fe-v2', notes: 'Upgrade main frontend' },
        { id: 'cs5', type: 'state-transition', componentId: 'frontend-mobile', fromState: 'mob-v1', toState: 'mob-v2', notes: 'Release mobile v2' },
        { id: 'cs6', type: 'state-transition', componentId: 'gateway', fromState: 'gw-both', toState: 'gw-v2', notes: 'Cut off v1 routes' },
        { id: 'cs7', type: 'state-transition', componentId: 'backend', fromState: 'be-compat', toState: 'be-v2', notes: 'Remove v1 endpoints' },
      ],
    },
    {
      id: 'plan-wrong',
      name: 'Incorrect Order (has violations)',
      description: 'Frontends migrated before gateway is ready',
      steps: [
        { id: 'ws1', type: 'state-transition', componentId: 'frontend-main', fromState: 'fe-v1', toState: 'fe-v2', notes: 'Should fail — gateway not ready' },
        { id: 'ws2', type: 'state-transition', componentId: 'backend', fromState: 'be-v1', toState: 'be-compat' },
        { id: 'ws3', type: 'state-transition', componentId: 'gateway', fromState: 'gw-v1', toState: 'gw-both' },
        { id: 'ws4', type: 'state-transition', componentId: 'frontend-mobile', fromState: 'mob-v1', toState: 'mob-v2' },
      ],
    },
  ],
  releases: [
    { componentId: 'backend', fromState: 'be-v1', toState: 'be-compat', status: 'released' },
    { componentId: 'shared-lib', fromState: 'lib-v1', toState: 'lib-v2', status: 'implemented' },
  ],
  diagrams: [],
}
