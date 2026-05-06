# Design Conformance Gate

Use this gate after the acceptance-criteria gate passes and before validation,
push, PR creation, or `In Review`.

Inspect the Linear issue description, comments, attachments, and linked
documents for local paths such as `docs/design/...` and
`docs/superpowers/specs/...`.

| Design state | Evidence to record | Action |
|---|---|---|
| No local design reference | `not_applicable` and empty checked paths | Continue. |
| Referenced design matches implementation, tests, evals, and verification evidence | `pass` and every checked path | Continue. |
| Implementation contradicts, omits, or lacks coverage for design-critical behavior | `fail`, every checked path, and concise mismatch evidence | Stop before validation, evals, push, or PR creation. |

The design document is the source of truth. Use Linear AC checkbox state only to
confirm that the AC gate already passed, not to accept behavior that
contradicts the design.
