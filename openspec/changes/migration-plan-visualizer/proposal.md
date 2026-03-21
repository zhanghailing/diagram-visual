## Why

Planning and communicating complex, multi-component migrations (e.g., API versioning, protocol changes, platform upgrades) is error-prone and opaque — teams lack a shared visual tool to reason about dependency ordering, feasibility constraints, and the intermediate states between "old" and "new". This change introduces a web application purpose-built for modeling, visualising, and comparing migration plans across heterogeneous component ecosystems.

## What Changes

- **New web application**: A browser-based, interactive diagram tool for defining components (frontend, backend, shared library, gateway, platform, etc.), their states, and the changes they undergo during a migration.
- **Component state modelling**: Each component can exist in multiple states (e.g., `v1-only`, `v1+v2-compat`, `v2-only`) representing stages of a migration lifecycle.
- **Dependency graph**: Directed dependency edges between components define which components must reach a certain state before others can proceed — enabling feasibility analysis.
- **Migration plan sequences**: Users can define multiple migration plans (ordered sequences of component state transitions) and visualise them as timelines or step-by-step diagrams.
- **Feasibility validation**: The system automatically detects plans that violate dependency constraints and highlights them visually with reasons.
- **Before/After comparison**: Side-by-side or overlay views show the difference between two states of a component or two migration plans.
- **Solution comparison**: Multiple alternative migration plans can be loaded and compared to evaluate trade-offs.
- **Release tracking**: Users can mark which changes have been implemented and released per component, updating the live feasibility view.

## Capabilities

### New Capabilities

- `component-registry`: Define and manage components with types, properties, and multi-state lifecycle definitions
- `dependency-graph`: Model directed dependencies between components and specify state-level preconditions
- `migration-plan`: Create ordered sequences of component state transitions representing a migration plan
- `feasibility-analysis`: Validate migration plans against dependency constraints; identify and explain blocking violations
- `plan-visualizer`: Interactive visual timeline/diagram rendering of migration plans and component states
- `release-tracker`: Mark changes as implemented/released per component and reflect live status in visualisations
- `plan-comparison`: Side-by-side or overlay comparison of two or more migration plans or component states
- `state-diff-viewer`: Before/after diff view for component state changes within or between plans

### Modified Capabilities

## Impact

- **New project**: No existing codebase — greenfield web application.
- **Frontend**: React-based SPA with an interactive graph/diagram library (e.g., React Flow or D3).
- **State management**: Client-side state (components, plans, release status) with optional persistence (local storage / file import/export).
- **No backend required initially**: All logic runs in-browser; data can be saved/loaded via JSON files.
- **Dependencies**: React, a graph visualisation library (React Flow / Dagre / D3), and a UI component library (e.g., shadcn/ui or Radix).
