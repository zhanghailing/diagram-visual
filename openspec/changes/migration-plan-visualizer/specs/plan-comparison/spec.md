## ADDED Requirements

### Requirement: Select two or more plans for comparison
The system SHALL allow users to select two or more migration plans to compare simultaneously.

#### Scenario: Select plans for comparison
- **WHEN** the user selects two plans from the plan list to compare
- **THEN** both plans are loaded into the comparison view

#### Scenario: Compare up to four plans
- **WHEN** the user selects up to four plans
- **THEN** all selected plans are rendered in the comparison view side by side

### Requirement: Side-by-side timeline comparison
The system SHALL render selected plans in parallel horizontal timelines with shared component rows, so that the same component's state across different plans can be read in the same row.

#### Scenario: Shared component rows
- **WHEN** two plans share a component
- **THEN** that component's row spans both timelines at the same vertical position

#### Scenario: Plans with different step counts
- **WHEN** the compared plans have different numbers of steps
- **THEN** shorter plans show empty/null cells for missing steps; the timelines are aligned by step index

### Requirement: Highlight differences between plans
The system SHALL visually highlight cells or steps that differ between compared plans (e.g., a step that exists in Plan A but not Plan B, or the same component transitioning at a different step).

#### Scenario: Different transition step highlighted
- **WHEN** component X transitions at step 3 in Plan A but at step 5 in Plan B
- **THEN** both cells are highlighted to indicate a positional difference

#### Scenario: Step absent in one plan
- **WHEN** a step exists in Plan A but has no equivalent in Plan B
- **THEN** Plan B's corresponding position shows a visually distinct "absent" marker

### Requirement: Feasibility overlay in comparison
The system SHALL show feasibility status for each plan in the comparison view, allowing users to quickly see which plans are feasible and which are not.

#### Scenario: Infeasible plan labelled in comparison
- **WHEN** one of the compared plans has violations
- **THEN** that plan's column/timeline header SHALL show an infeasible indicator

### Requirement: Switch comparison mode
The system SHALL support at least two comparison modes: side-by-side (plans rendered as parallel timelines) and overlay (differences highlighted on a single merged timeline).

#### Scenario: Switch to overlay mode
- **WHEN** the user switches to overlay comparison mode
- **THEN** a single timeline is rendered where steps that differ between the two plans are highlighted with both plan's values shown

#### Scenario: Switch back to side-by-side mode
- **WHEN** the user switches back to side-by-side mode
- **THEN** the parallel timeline view is restored
