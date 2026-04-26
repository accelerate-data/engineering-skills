# Discovery and Routing

Use this reference after branch/worktree setup and before implementation edits.

## Required Discovery

| Order | Check | Output or stop |
|---|---|---|
| 1 | Read Linear description, comments, attachments, labels, and linked documents | Issue context |
| 2 | Identify the Linear team | Team-scoped User Flow rule |
| 3 | For Studio, Roadmap, and Utilities issues, find the issue's User Flow label | Stop if missing |
| 4 | For Studio, Roadmap, and Utilities issues, require exact folder `docs/functional/<User Flow label>/` | Stop if missing |
| 5 | For Studio, Roadmap, and Utilities issues, read the matching functional spec before clarification, planning, or coding | Functional spec path |
| 6 | Search the codebase before user clarification | Relevant files and behavior |
| 7 | Search `docs/design/` by issue key, User Flow label, feature name, domain terms, and linked-document titles | Related design docs, or `not_applicable` |
| 8 | Search `docs/plan/` before creating a new plan | Existing plan path, or new plan needed |

For Studio, Roadmap, and Utilities issues, the User Flow label and functional-spec folder are hard prerequisites. Do not plan, code, or work around either gap. For other teams, do not fail solely because no User Flow label or functional spec exists; record functional spec as `not_applicable`.

| Design-doc situation | Action |
|---|---|
| Referenced related design doc exists | Read it before implementation planning |
| Referenced related design doc is missing | Treat as a context gap and route through design handoff |
| No related design doc after search | Record `not_applicable` in the plan and Linear updates |

## Handoff Order

Apply hard gates before implementation in this order:

| Condition | Handoff |
|---|---|
| User asks to think, review, brainstorm, compare options, or not start coding | `superpowers:brainstorming` |
| Functional behavior or product flow is missing, stale, or disputed | `authoring-functional-spec` |
| Bug report, unexplained defect, reproduction failure, flaky behavior, regression, or unexpected test result | `superpowers:systematic-debugging`; show root cause and proposed fix, then proceed only after confirmation |
| Durable architecture, data model, cross-service flow, security, migration, permissions, auditability, API/module boundary, or UI interaction contract is not covered | `authoring-design-spec` |
| True fork, unresolved option, or unclear product/design choice remains after discovery | `superpowers:brainstorming` |
| Non-bug implementation is ready after hard gates and discovery | `superpowers:writing-plans` |
| Simple bug fix is confirmed after systematic debugging | Proceed directly if no plan-worthy complexity remains |
| Complex bug fix is confirmed after systematic debugging | `superpowers:writing-plans` |

Resume implementation only after the hard-gate outcome exists or the user explicitly narrows the issue out of that gate's scope.

## Gap Rules

| Situation | Rule |
|---|---|
| Clarification is answerable from issue, code, functional spec, design docs, or plan | Resolve locally before asking the user |
| Exactly one viable path remains | State the path and continue |
| Two or more viable paths remain | Hand off to `superpowers:brainstorming` with context and a recommended starting option |
| Hard context gap remains | Do not create an implementation plan |
| Need user input from this skill | Do not ask ad hoc implementation questions; use the appropriate handoff |

## Bug Fix Confirmation

| Stage | Rule |
|---|---|
| Before fix edits | Use `superpowers:systematic-debugging` to reproduce or isolate the defect |
| Before implementation | Show the root cause and proposed fix |
| User confirmation | Proceed only after the user confirms the issue and fix direction |
| Simple fix | May proceed without `superpowers:writing-plans` |
| Complex or multi-module fix | Use `superpowers:writing-plans` before implementation |
