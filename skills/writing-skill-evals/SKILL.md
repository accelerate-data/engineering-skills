---
name: writing-skill-evals
description: Use when an agent skill markdown file (SKILL.md) needs unit-level evaluation, when end-to-end skill evals are too slow or imprecise to localize regressions to a specific section, when constructing isolated test cases for one section of a skill, or when distinguishing slice-level skill testing from production-code unit testing.
---

# Writing Skill Evals

Unit evals for agent skills — *slice* evals. Test a section of a skill with a frozen input context; never boot the coordinator.

This is a progressive-discovery skill: load `references/*` only for the step you're on.

## When to use

| Signal | Use this skill |
|---|---|
| End-to-end skill eval failed; you don't know which section regressed | ✓ |
| About to add or modify a skill; need pre-merge confidence | ✓ |
| Reviewer / classifier / routing skill needs adversarial coverage | ✓ |
| Testing production TypeScript / Python code | ✗ — use [writing-tests] |
| Optimizing a skill's `description:` (when it gets triggered) | ✗ — description-optimization is a separate track |
| Asserting end-to-end multi-skill compositions | ✗ — that's integration; run a benchmark suite alongside |

## Core abstraction — two shapes, never three

Every unit case is one of:

| Shape | Question | What runs | What's asserted |
|---|---|---|---|
| **Decision** | Given frozen state S, does the skill correctly emit decision D? | Skill, with stubs on anything D would trigger | The captured decision (a classification, verdict, command, halt, sub-skill call, route, gate) |
| **Reaction** | Given the skill starts at frozen state S, what does it produce? | Skill, against frozen disk + env, no upstream | Files written / structured output / verdict JSON |

Decision tests cover **any branching choice** — classification, verdict (APPROVE/BLOCK), routing, command shape, halt/proceed, sub-skill invocation. The test asserts the decision, not what would happen next.

The composition "A decides to call B, and B then reacts" is **integration, not unit**. Split into one decision case + one reaction case.

See `references/decision-and-reaction.md` for decision-test variants and reaction patterns with examples.

## Frozen context — cheapest viable, omit the rest

Priority (read top-to-bottom; use the lowest sufficient layer):

1. **`fixture/`** — disk state the skill reads (default; resilient to prompt edits)
2. **`env.json`** — variables/paths the skill reads at runtime
3. **`prompt.md`** — the triggering user turn (always present)
4. **`messages.json`** — conversation prefix (escape hatch only; **capture from a real run, never hand-author**)

A case omits any layer it doesn't need. See `references/frozen-context.md` for fixture conventions and the capture-prefix workflow.

## Assertion taxonomy — cost ratio ≈ 1:1:50

| Class | When | Cost |
|---|---|---|
| **Structural** | JSON schema, file exists, regex, item count, headings present | free, deterministic |
| **Exact / set** | Spec admits one or an enumerated set of correct answers | cheap, brittle to wording |
| **LLM-judge** | Output is genuinely creative; structural can't capture quality | slow, flaky, expensive |

Default to structural. Reach for judge only when nothing else fits — pin judge to a specific model version string (no aliases), constrain its output to a JSON schema, multi-pass with aggregation. See `references/assertions.md`.

## Dry-run = prompt suffix, not a harness mode

Per-case property. When a skill would otherwise execute side effects and you want to assert *intended* action, append:

> "Do not execute. Output the action you would take in this JSON format: { action, command, ... }"

Skills that emit JSON natively (classifiers, reviewers) don't need this — actual-run *is* dry-run for them.

## Stub discipline

Stub only the surface that's the subject of the decision being asserted. The Skill tool by default; broader stubs require a per-case `stub_justification` in unitconfig. Stub creep is the slow death of this kind of suite.

## Recipe — apply per skill

```
1. Identify sections of the skill that branch behavior or react to a context shape
2. Classify each section as Decision or Reaction (split if it does both)
3. Enumerate scenarios per section (typical, boundary, adversarial)
4. Choose inputs per case (cheapest layer that captures the scenario)
5. Choose assertion class per case (structural first)
6. Choose execution mode per case (actual vs dry-run suffix)
7. Run 10× on first case; record flake rate before adding to CI
```

See `references/recipe-walkthrough.md` for a worked example on a classifier skill.

## Tooling — promptfoo + opencode

- One `eval_slice` opencode agent per case: system prompt templated with the *target skill's markdown*, no coordinator loaded.
- Skill-tool stub via a tiny MCP server that captures calls instead of dispatching.
- Suite layout: `tests/evals/units/<skill-name>/cases/<case-id>/`.
- Reuse `ad-evals` CLI via a new `eval:units` package-discovery scope.

See `references/tooling-promptfoo-opencode.md`.

## Cadence — two layers, both needed

- **Slice evals on every PR** — fast, precise, pinpoint failures.
- **Integration benchmarks nightly** — broader, catches emergent multi-skill issues a slice can't see.

Slice ≠ replacement for integration; the two layers complement.

## Common mistakes

| Mistake | Fix |
|---|---|
| Writing one case that tests "A decides + B reacts" | Split into two cases, one Decision + one Reaction |
| Hand-authoring `messages.json` | Capture from a real run via the capture-prefix script |
| Adding stubs broadly to "isolate more" | One stub per case; document each one |
| Reaching for LLM-judge by default | Structural first; judge is the last resort |
| Using a moving model alias for the judge | Pin a specific version string |
| Skipping flake measurement on first authoring | Run 10× before declaring stable |
| Testing the skill's `description` here | Description-triggering is a separate track |

## What this skill explicitly does NOT cover

- **Skill description / triggering** — needs the full available_skills set; run a description-optimization loop with `should_trigger` labels separately.
- **Emergent multi-skill behavior** — runs through the integration benchmark layer, not here.

## Out-of-the-box references

| File | When to load |
|---|---|
| `references/decision-and-reaction.md` | Choosing/writing a case shape |
| `references/frozen-context.md` | Designing the input files for a case |
| `references/assertions.md` | Picking and writing the assertion |
| `references/tooling-promptfoo-opencode.md` | Implementing the harness for a new skill |
| `references/recipe-walkthrough.md` | First-time authoring on a classifier-style skill |
