# Skill Eval User Behavior Quality

> **Status:** Draft

## Overview

The eval suite covers the current skill contracts, but much of the harness still asks models to read the skill and emit a boolean contract summary. That catches regressions in written obligations, but it can overfit to the skill text and under-measure whether a real user prompt would route the agent through the right workflow.

This design defines the next cleanup pass: split user-like inputs from evaluator-only expectations, keep common failure modes explicit, and add static checks that prevent eval prompts from drifting back into contract restatement.

## Review Findings

| Finding | Evidence | Impact |
|---|---|---|
| Eval prompts are mostly meta-evaluations | Every prompt asks for a JSON shape; most say the scenario is read-only and ask for workflow obligations | Models can pass by contract extraction instead of demonstrating user-facing behavior |
| Scenario YAML often contains evaluator facts, not user text | Linear and PR evals include lines such as preconditions, expected docs, branch state, and hidden gates | Scenarios are easier than real user prompts because they disclose the classification cues |
| Boolean schemas are oversized for dense skills | `implementing-linear-issue`, `raising-linear-pr`, and `writing-tests` have the largest field sets | Adding fields can become a proxy for testing the prompt template rather than the skill behavior |
| Exact term checks are brittle | Some evals require literal skill names, document paths, or status words | Good behavior can fail for wording differences, while shallow keyword echoes can pass |
| Common failure modes are not first-class | Failure modes live in descriptions, assertions, and skill prose instead of a shared eval matrix | Coverage is hard to audit skill-by-skill, and new skill mistakes may lack regression tests |
| User-like coverage is uneven | Linear creation and implementation have many natural phrases; `maintain-github-repos`, `closing-linear-issue`, and `explaining-code` have narrow scenario sets | Important workflows may only prove one happy path or one hard gate |

## Current Coverage Snapshot

| Skill | Tests | Main Strength | Main Gap |
|---|---:|---|---|
| `adversarial-review` | 3 | Opposite-model routing and reviewer synthesis | No realistic review request transcript |
| `authoring-flow-spec` | 7 | Preconditions and canonical flow lookup | Scenarios are mostly contract checkpoints |
| `closing-linear-issue` | 2 | Merged vs unmerged PR behavior | Too few closeout variants and no full user prompt set |
| `code-simplifier` | 11 | Preserving behavior while simplifying | Boolean schema is broad enough to invite contract echo |
| `creating-feature-request` | 3 | User Flow requirement and metadata gates | Needs non-trivial feature expansion and bug-style request coverage |
| `creating-linear-issue` | 10 | User Flow gates, bug intake, decomposition | Some scenarios expose labels/spec state too directly |
| `e2e-adding-scenario` | 10 | Harness preconditions and vocabulary handling | Needs more real operator phrasing |
| `e2e-authoring-feature-file` | 8 | Creation guards and environment discovery | Needs more messy request variants |
| `e2e-extending-step-vocabulary` | 6 | Duplicate and cross-backend refusal | Narrow coverage of step-design ambiguity |
| `e2e-regenerating-from-guide` | 9 | Mapping, guide, and missing-step gates | Needs more user-driven regeneration phrasing |
| `explaining-code` | 2 | Explanation shape | Too little coverage for terse or confused user questions |
| `implementing-linear-issue` | 14 | Handoffs, User Flow gates, quality gates | Largest overfit risk from disclosed preconditions and schema size |
| `maintain-github-repos` | 1 | Destructive-action confirmation policy | Single scenario and exact script-path coupling |
| `raising-linear-pr` | 9 | AC and design-conformance gates | Large oracle schema and path-specific term checks |
| `writing-tests` | 21 | Test workflow modes and failure modes | Largest schema; many fields are skill-contract assertions |
| `yolo` | 5 | Routing boundaries | Needs more realistic mixed-intent prompts |

## Key Decisions

| Decision | Rationale |
|---|---|
| Keep the read-only harness, but stop making it the only behavior signal | It is useful for fast workflow regression checks, but it is not enough to mimic user behavior |
| Store user prompt text separately from evaluator context | The model should see a natural request; the assertion layer can hold hidden oracle facts |
| Add a common failure-mode matrix per skill | Coverage should be auditable by failure mode, not just by test count |
| Prefer semantic assertions over exact required terms | Assertions should accept equivalent correct behavior and reject shallow keyword echoes |
| Add a static anti-overfit check for eval prompts | Prompt templates should fail review when they restate the full skill contract or expose expected outcomes |
| Keep dense contract checks only where they are explicitly labeled as oracle checks | Contract extraction can remain useful, but it should not be confused with user-behavior coverage |

## Proposed Eval Shape

| Layer | Visible to model | Owned by | Purpose |
|---|---|---|---|
| User prompt | Natural user message, minimal repo context, realistic ambiguity | YAML fixture | Measures routing and next-action behavior |
| Hidden scenario context | Simulated tool facts, Linear metadata, files that exist or are missing | YAML fixture | Lets assertions grade without leaking answer cues |
| Expected behavior | Small list of required decisions and forbidden mistakes | Assertion file | Keeps grading precise without exposing contract language |
| Common failure IDs | Stable IDs such as `asks-before-reading`, `skips-functional-spec`, `creates-pr-too-early` | Package metadata | Makes coverage review systematic |

## Common Failure Mode Matrix

| Failure Mode | Applies To | Example Eval Behavior |
|---|---|---|
| Acts before reading local context | Linear skills, e2e skills, code-simplifier, writing-tests | User says "implement ENG-123"; eval expects codebase/spec lookup before asking or editing |
| Skips mandatory User Flow gate | Creating/implementing feature work | Missing label or functional spec stops the workflow |
| Treats brainstorm/review/think as implementation approval | `implementing-linear-issue`, `yolo` | User asks to think first; eval expects brainstorming or planning, not code edits |
| Uses PR/merge behavior in the wrong phase | Linear implementation, PR, closeout, yolo | Implementation does not push or create PR; PR phase does not merge |
| Over-asks instead of resolving locally | Creating issues, implementing issues, writing tests | Eval expects local discovery before a question unless there is a real fork |
| Hides uncertainty with a premature success claim | All implementation and validation skills | Eval expects verification evidence or a blocked status |
| Weakens tests or fixtures to pass | Code-simplifier, writing-tests, implementing issues | Eval forbids updating expected data to mask behavior drift |
| Uses destructive actions without scoped confirmation | Closing issue, maintain repos | Eval requires preview, exact confirmation, or merge evidence first |
| Misses required handoff | Implementing issue, writing-tests, authoring-flow-spec | Eval expects the named handoff only when the scenario naturally calls for it |

## Migration Plan

| Step | Change | Output |
|---|---|---|
| 1 | Add eval metadata fields: `user_prompt`, `hidden_context`, `failure_modes`, and `eval_type` | Fixtures distinguish user-behavior tests from oracle tests |
| 2 | Add `scripts/check_eval_user_behavior.py` | Static check flags prompt templates that expose expected booleans, long contract schemas, or evaluator-only wording in user prompts |
| 3 | Convert one high-risk package first: `implementing-linear-issue` | Proves the split for User Flow, brainstorm, design, bug, TDD, and quality gates |
| 4 | Convert Linear workflow packages | Covers `creating-linear-issue`, `creating-feature-request`, `raising-linear-pr`, `closing-linear-issue`, and `yolo` |
| 5 | Convert support skills | Covers code simplification, test writing, e2e authoring, explanation, review, and repo maintenance |
| 6 | Keep remaining boolean contract evals behind `eval_type: contract-oracle` | Preserves fast regression checks while making overfit risk visible |
| 7 | Update `npm run eval:coverage` | Coverage report includes failure-mode IDs and user-behavior vs contract-oracle counts |

## Acceptance Criteria

| Criterion | Target |
|---|---|
| User-like prompts | Every skill has at least two `eval_type: user-behavior` cases unless the skill has only one meaningful workflow |
| Hidden expectations | Expected booleans and required terms are not visible in user prompt text |
| Failure-mode coverage | Every skill maps each high-risk common mistake in its `Common Mistakes` section to at least one eval or an explicit non-applicable note |
| Dense schemas | Contract-oracle prompts are allowed, but user-behavior prompts do not ask for more than ten top-level fields |
| Exact terms | Required literal terms are limited to names or paths that must actually appear in the user-facing workflow |
| Static gate | Repository checks fail when eval prompts include full skill contracts, hidden answer cues, or evaluator facts in user prompt fields |

## What This Is Not

| Exclusion | Reason |
|---|---|
| A request to delete all current evals | Existing contract checks are useful while the suite migrates |
| A requirement to run agentic evals during this review | The current task is a static suite review and design proposal |
| A new skill contract | Skill behavior stays in `skills/`; this document governs eval quality |
| A product-specific eval helper | The harness must stay self-contained in this plugin repo |

## Key Source Files

| File | Purpose |
|---|---|
| `tests/evals/packages/` | Promptfoo package fixtures and expected outcomes |
| `tests/evals/prompts/` | Prompt templates shown to evaluator models |
| `tests/evals/assertions/` | JavaScript assertion logic for behavior checks |
| `tests/evals/scripts/eval-coverage.js` | Deterministic eval coverage reporting |
| `skills/*/SKILL.md` | Skill contracts and Common Mistakes sections that evals should cover |
| `scripts/check_skill_prose_wraps.py` | Existing static check pattern for lightweight repository policy |

## Open Questions

1. Should contract-oracle evals remain in the default `npm run eval` suite, or move behind an explicit `eval:contract-oracle` script?
2. Should user-behavior evals ask for a short next-action response instead of JSON, with assertions parsing evidence from natural language?
3. Should failure-mode IDs live in each package YAML or in a shared manifest under `tests/evals/`?
