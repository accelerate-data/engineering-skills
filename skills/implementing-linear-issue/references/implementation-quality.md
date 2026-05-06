# Implementation Quality

Use this reference once discovery and hard-gate routing are complete.

## Implementation Plan

Before invoking `superpowers:writing-plans`, must invoke `writing-tests` to enumerate the complete test scenario set and produce a coverage map across unit, integration, and Promptfoo evals. Scenarios that cannot be automated must be explicitly identified with justification. Simple confirmed single-module bug fixes that do not require `writing-plans` also skip `writing-tests`.

Use `superpowers:writing-plans` to create or resume the implementation plan under `docs/plan/` before non-bug implementation, multi-module changes, refactors, complex bug fixes, or durable design work. A simple confirmed bug fix may proceed without a written implementation plan after systematic debugging shows the root cause and proposed fix, and the user confirms the fix direction.

After plan approval, check whether the plan contains 2+ tasks with no shared files and no ordering dependency between them. If yes, route to `superpowers:subagent-driven-development`. When in doubt, treat tasks as independent if they can be reviewed separately. Otherwise implement sequentially.

| Plan item | Requirement |
|---|---|
| Approach | Chosen approach and rejected alternatives when relevant |
| Change scope | Files or modules expected to change inside the isolated worktree |
| Slices | Commit checkpoints or slice boundaries for multi-step work |
| Tests | Unit, integration, eval, and manual-test scope |
| Skill evals | Affected skill or plugin eval coverage |
| Functional spec | Path from `docs/functional/<User Flow label>/` |
| Design docs | Related `docs/design/` paths, or `not_applicable` after search |
| Implementation plan | Path under `docs/plan/` |
| Independent gates | Subagent reviewers for code review, simplification, test coverage, and AC review |
| Manual checks | Scope, or `No manual tests required.` |

## Bug Fix Path

| Stage | Requirement |
|---|---|
| Investigation | Use `superpowers:systematic-debugging` before fix edits |
| Evidence | Show root cause and proposed fix |
| Confirmation | Wait for user confirmation of the issue and fix direction |
| Simple fix | Proceed without `superpowers:writing-plans` if no plan-worthy complexity remains |
| Complex fix | Use `superpowers:writing-plans` before implementation |

## Coding Discipline

| Area | Rule |
|---|---|
| Implementation | Use `superpowers:test-driven-development` when the slice needs test-first behavior coverage |
| Behavior changes | Start each slice with RED, then GREEN, then REFACTOR |
| Bug fixes | May use TDD or add regression coverage after root-cause isolation when that is the safer fit |
| Existing tests | Read before changing |
| Logging | Add for new behavior per repo policy |
| Slicing | Work in end-to-end slices that can be reviewed independently |
| Commits | Create checkpoint commits after major green slices |

## Quality Gates

Before handoff:

| Gate | Runner | Context |
|---|---|---|
| Changed-area validation | Local command | Changed files and repo commands |
| Changed skill or command evals | Promptfoo | Affected eval package only |
| Code review | Independent subagent using `superpowers:requesting-code-review` | Issue, specs, plan, diff, verification |
| Simplification review | Independent subagent using `code-simplifier` | Changed files, intent, diff |
| Test coverage review | Independent subagent using `superpowers:requesting-code-review` | Tests, uncovered risks, verification |
| Acceptance-criteria review | Independent subagent | Linear issue, specs, plan, diff, evidence |

| Review rule | Requirement |
|---|---|
| Subagent context | Give only issue text, functional spec, related design docs, implementation plan, commit range or diff, changed-file context, and verification evidence |
| Inline review | Never substitute inline self-review for a required subagent gate |
| Findings | Use `superpowers:receiving-code-review` before applying any quality-gate, human, or external review feedback |
| Verified feedback | Resolve one item at a time and rerun the relevant validation |
| Failed or unverified gate | Stop |

### Functional Spec Reconciliation

Applies to Studio, Roadmap, and Utilities issues only. After all quality gates pass, compare as-built behavior against the functional spec. If any AC is implemented differently than the spec describes, or if implementation adds or removes behavior the spec does not cover, route to `doc-skills:authoring-functional-spec` to update the spec before handoff. If the spec is already current, record that verification in the final Linear note.
