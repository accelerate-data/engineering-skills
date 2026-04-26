# Issue Breakdown

Use this reference when a requested feature, parent ticket, plan, or spec is too large for one Linear issue.

## Breakdown Rules

| Rule | Requirement |
|---|---|
| Slice vertically | Each issue should deliver a narrow user-visible path through the necessary layers. Do not split into frontend-only, backend-only, schema-only, or tests-only tickets unless that work is independently useful. |
| Prefer small complete slices | Many thin, independently verifiable issues are better than a few broad issues. |
| Preserve dependencies | Create blockers first so later issues can reference them. |
| Separate decision work | Mark slices that need a human product, design, or architecture decision before implementation. |
| Keep issue bodies durable | Describe user outcome and acceptance criteria, not file paths or implementation mechanics. |

## Proposed Breakdown

Before creating child issues, show the user:

| Field | Include |
|---|---|
| Title | Short issue title for the slice |
| Type | Independent implementation slice or decision-required slice |
| User outcome | The complete behavior this slice unlocks |
| Blocked by | Earlier slice title or `None` |
| Acceptance criteria | Verifiable user-level checks |

Ask whether the granularity, dependencies, and decision-required markings are right. Iterate until the user approves the breakdown, then create issues in dependency order.
