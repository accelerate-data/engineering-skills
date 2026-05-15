# Implementation Quality

Use this reference during Phase 4 execution, after the routing decision is complete and the plan is approved.

## Coding Discipline

| Area | Rule |
|---|---|
| Skill or agent content | Use `superpowers:writing-skills` for progressive discovery, reference placement, repetition checks, and skill TDD discipline |
| Implementation | Use `superpowers:test-driven-development` when the slice needs test-first behavior coverage |
| Behavior changes | Start each slice with RED, then GREEN, then REFACTOR |
| Bug fixes | May use TDD or add regression coverage after root-cause isolation when that is the safer fit |
| Existing tests | Read before changing |
| Logging | Add for new behavior per repo policy |
| Slicing | Work in end-to-end slices that can be reviewed independently |
| Commits | Create checkpoint commits after major green slices |

## Quality Gate Details

The gate list lives in SKILL.md Phase 4 step 11. This reference provides runner and context details. Code review is a required Phase 4 quality gate, not an optional follow-up when someone happens to ask for review.

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
