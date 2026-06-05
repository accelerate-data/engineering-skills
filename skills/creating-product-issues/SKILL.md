---
name: creating-product-issues
description: >-
  Use when filing, logging, raising, reporting, or submitting a product issue,
  feature request, bug, or feedback for the Studio or Utilities product areas
  in Linear.
argument-hint: "[request-or-issue-context]"
---

# Creating Product Issues

## Overview

Turn a product request into a clear Linear issue in the `Studio` or `Utilities` team only, after repo discovery, field resolution, source-doc review, user confirmation, and draft approval. The team owner is resolved from a static team-to-owner map. No `project`, `milestone`, or `cycle` is assigned.

## When to Use

- User asks to file, log, raise, report, or submit a product issue, feature request, bug, or feedback for the Studio or Utilities product areas.
- The request needs Linear metadata, source context, or decomposition before it can be safely filed.
- Do not use for implementation, PR raising, merge, closeout, or cleanup.
- Do not use for engineering-team issues — use `creating-linear-issue` for those.

## Workflow

| Step | Requirement |
|---|---|
| 1 | Classify the request as `feature`, `bug`, or `spike` |
| 2 | Search the codebase and existing Linear issues before asking the user |
| 3 | Resolve `team` (must be `Studio` or `Utilities`), User Flow child label, and `owner` from the static team-to-owner map in `references/field-resolution.md` |
| 4 | Read the matching functional spec before issue creation |
| 5 | Search and read related design docs; record `not_applicable` when none are related |
| 6 | Use `superpowers:brainstorming` when a feature is broad, non-trivial, or still has product forks |
| 7 | Use `../creating-linear-issue/references/bug-intake.md` for bug issues |
| 8 | Use `../creating-linear-issue/references/issue-breakdown.md` when the request is too large for one issue |
| 9 | Confirm resolved fields (team, owner, User Flow label) with the user in one question |
| 10 | Show the issue draft and create/update only after approval |

## Hard Gates

- Stop if the resolved team is anything other than `Studio` or `Utilities`. Explain that this skill files product issues only into Studio or Utilities, and ask the user to email `ss@acceleratedata.ai` if the right target is unclear.
- Stop if no User Flow child label is confirmed for the resolved team. The label is required for downstream triage.
- Do not draft while team resolution, User Flow label, owner resolution, brainstorming outcomes, bug-intake gaps, decomposition gaps, functional spec, or related design docs remain unresolved.
- Do not ask the user for details the codebase, functional spec, design docs, or existing Linear issues already answer.
- Do not set `project`, `milestone`, or `cycle` on the filed issue.

## Source Context

For all issues filed by this skill (both Studio and Utilities require it):

- read the functional spec before drafting
- search `docs/design/` by User Flow label, feature name, domain terms, and linked-document titles
- cite the functional spec path and related design doc paths in the Linear description for downstream implementation traceability

## Issue Draft

Show the full draft before creating or updating the issue. Include:

- selected issue kind and why
- resolved team, owner, and User Flow label
- functional spec path and related design doc paths, or `not_applicable`
- brainstorming summary for non-trivial feature scope when applicable
- bug-intake summary for bug issues when applicable
- dedupe result
- issue draft outline
- decomposition approach when scope is too large for one issue

Create or update the Linear issue only after user approval.

### Body Template

```md
## Problem
...

## Goal
...

## Non-goals
- ...

## Acceptance Criteria
- [ ] ...

## Risks
- ...

## Test Notes
- ...
```

Include the functional spec path and related design doc paths in the description so triage and implementation can trace source context. Do not include `project`, `milestone`, or `cycle` fields.

## Linear Operations

Use available Linear MCP tools for issue, label, and comment operations. Retry once on tool failure, then stop and report the exact failing step.

Read `references/linear-operations.md` for User Flow child-label lookup and owner-by-email lookup mechanics.

## Common Mistakes

- Filing into a team other than `Studio` or `Utilities`.
- Setting `project`, `milestone`, or `cycle` fields (the skill explicitly does not).
- Resolving owner from the user running the skill instead of the static team-to-owner map.
- Filing without a User Flow label or matching functional spec.
- Turning the feature request into an implementation plan.

## References

- [`references/field-resolution.md`](references/field-resolution.md) — issue kind, team allowlist, static team-to-owner map, User Flow rule, and confirmation question
- [`references/linear-operations.md`](references/linear-operations.md) — Linear MCP tool policy, User Flow child-label lookup, and owner-by-email lookup
- [`../creating-linear-issue/references/issue-drafting.md`](../creating-linear-issue/references/issue-drafting.md) — draft approval content and issue body template (shared with `creating-linear-issue`)
- [`../creating-linear-issue/references/issue-breakdown.md`](../creating-linear-issue/references/issue-breakdown.md) — vertical-slice decomposition (shared)
- [`../creating-linear-issue/references/bug-intake.md`](../creating-linear-issue/references/bug-intake.md) — bug issue intake checks (shared)
