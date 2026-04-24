# PR Phase Gates

Use these gates after the feature branch is rebased and before validation, push, PR creation, or `In Review`.

## Acceptance Criteria

| AC state | Action | Continue? |
|---|---|---|
| Already checked in Linear | Leave it checked. | Yes, if all other ACs pass. |
| Unchecked but proven complete by committed work and existing evidence | Check it off in Linear as metadata only. Do not edit files or commit. | Yes, after every AC is checked. |
| Incomplete, unproven, blocked, or requiring code/test/docs | Stop and hand back to `implementing-linear-issue` with the specific ACs. | No. |

Stop on incomplete ACs before the design conformance gate, validation, evals, push, PR creation, or `In Review`.

## Design Conformance

Inspect the Linear issue description, comments, attachments, and linked documents for local paths such as `docs/design/...` and `docs/superpowers/specs/...`.

| Design state | Evidence to record | Action |
|---|---|---|
| No local design reference | `not_applicable` and empty checked paths | Continue. |
| Referenced design matches implementation, tests, evals, and verification evidence | `pass` and every checked path | Continue. |
| Implementation contradicts, omits, or lacks coverage for design-critical behavior | `fail`, every checked path, and concise mismatch evidence | Stop before validation, evals, push, or PR creation. |

The design document is the source of truth. Use Linear AC checkbox state only to confirm that the AC gate already passed, not to accept behavior that contradicts the design.
