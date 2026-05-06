# Implementing Linear Issue — Routing Improvements

> **Status:** Approved
> **Issues:** AD-35, AD-36, AD-38, AD-41

## Overview

Four targeted improvements to `implementing-linear-issue` that make pre-implementation
routing, test planning, execution routing, and post-implementation spec reconciliation
explicit and machine-enforceable. All changes are surgical additions to existing sections —
no new reference files or packages.

## Key Decisions

| Decision | Rationale |
|---|---|
| Self-assess complexity then ask, not ask unconditionally | Unconditional brainstorming adds friction for simple issues; self-assessment with a focused question is the right balance |
| Define complexity signals concretely (2+ modules, 2+ paths, sequencing risk) | Vague "complex" language is rationalized away; concrete signals resist that |
| `writing-tests` runs before `writing-plans`, not inside TDD slices | Scenario enumeration shapes the plan; discovering test gaps after planning causes rework |
| Spec reconciliation is a quality gate, not a pre-implementation gate | Implementation may legitimately clarify or extend behavior; the right time to update the spec is after seeing what was built |
| Spec reconciliation scoped to selected teams (Studio, Roadmap, Utilities) | Non-selected-team issues record functional spec as `not_applicable`; the gate cannot fire without a spec |
| Define independence for subagent routing (no shared files, no ordering dependency) | "Independent" without definition leads to over- or under-routing; a tie-break rule removes ambiguity |
| Spec-stop does not bypass execution-phase routing | A stop for a missing spec resolves when the spec is authored; the execution routing decision still applies afterward |

## Change Map

| File | Issues | Change |
|---|---|---|
| `skills/implementing-linear-issue/SKILL.md` | AD-35, AD-41 | New workflow steps for complexity assessment and execution routing |
| `references/discovery-and-routing.md` | AD-35 | Complexity assessment row in Handoff Order table with concrete signals |
| `references/implementation-quality.md` | AD-36, AD-41, AD-38 | `writing-tests` pre-plan row; execution routing row; spec reconciliation quality gate row |
| `tests/evals/prompts/skill-implementing-linear-issue.txt` | AD-35, AD-36, AD-38, AD-41 | Four new JSON fields in the eval output schema |
| `tests/evals/assertions/check-linear-skill-contract.js` | AD-35, AD-36, AD-38, AD-41 | Four new field checks wired to `expect_*` vars |
| `tests/evals/packages/implementing-linear-issue/promptfooconfig.json` | AD-35, AD-36, AD-38, AD-41 | 12 new test cases (4 primary + 8 boundary) |

## Detailed Changes

### AD-35 — Complexity self-assessment + brainstorm gate

**Location:** `references/discovery-and-routing.md` Handoff Order table; `SKILL.md` workflow table.

New row in the Handoff Order table (inserted before the existing "True fork" row):

> Issue touches 2+ modules, has 2+ viable implementation paths, or has meaningful sequencing
> risk across slices → self-assess; ask: "This looks complex because [X] — do you want to
> brainstorm the approach first?"; if yes → `superpowers:brainstorming`; if no → continue

Rationalization guard: complexity signals are concrete (2+ modules, 2+ paths, sequencing risk).
Agents cannot classify an issue as "simple" solely on title or ticket size.

### AD-36 — `writing-tests` before `writing-plans`

**Location:** `references/implementation-quality.md` Implementation Plan table.

New row (before the plan-creation instruction):

> Before invoking `superpowers:writing-plans`, must invoke `writing-tests` to enumerate the
> complete test scenario set and produce a coverage map across unit, integration, and Promptfoo
> evals. Scenarios that cannot be automated must be explicitly called out with justification.

Bug-fix path note: the same coverage reasoning applies before a complex bug-fix plan; simple
confirmed single-module bug fixes that do not require `writing-plans` also do not require `writing-tests`.

Rationalization guard: uses "must" and "explicitly called out" — agents cannot treat this as advisory.

### AD-38 — Functional spec reconciliation quality gate

**Location:** `references/implementation-quality.md` Quality Gates table.

New row at end of quality gates (selected teams only):

> For Studio, Roadmap, and Utilities issues: compare as-built behavior against the functional
> spec. If any AC is implemented differently than the spec describes, or if implementation adds
> or removes behavior the spec does not cover → route to `doc-skills:authoring-functional-spec`
> to update the spec before handoff. If spec is already current, record the verification result
> in the final Linear note.

Scope is explicit: non-selected-team issues record functional spec as `not_applicable`; this gate cannot fire.

### AD-41 — Subagent-driven-development execution routing

**Location:** `references/implementation-quality.md` Implementation Plan table; `SKILL.md` workflow table.

New row in Implementation Plan table (after plan approval):

> After plan approval: if the plan contains 2+ tasks that do not share files and have no
> ordering dependency, route to `superpowers:subagent-driven-development`. When in doubt,
> treat tasks as independent if they can be reviewed separately. Otherwise implement sequentially.

`SKILL.md` Stop Conditions addition:

> A spec/User-Flow stop on a Studio, Roadmap, or Utilities issue does not bypass
> execution-phase routing. Once the spec gate is cleared, return to the normal routing decision
> for the approved plan.

## Eval Coverage

| Test description | Primary assertion |
|---|---|
| Multi-module issue → agent asks complexity question, routes to brainstorming (yes) | `asks_complexity_question: true`, `hands_off_to_brainstorming: true` |
| Single-module obvious issue → no complexity question, no brainstorming | `asks_complexity_question: false`, `hands_off_to_brainstorming: false` |
| User says "no" to complexity question → skips brainstorming, continues | `hands_off_to_brainstorming: false`, `uses_writing_tests_before_plan: true` |
| Non-trivial implementation → `writing-tests` before `writing-plans` | `uses_writing_tests_before_plan: true`, `uses_writing_plans_before_implementation: true` |
| Complex multi-module bug fix → `writing-tests` before bug-fix plan | `uses_writing_tests_before_plan: true` |
| Simple single-module bug fix → no `writing-tests`, no `writing-plans` | `uses_writing_tests_before_plan: false`, `simple_bug_can_skip_writing_plan: true` |
| As-built diverges from functional spec → route to `authoring-functional-spec` | `updates_functional_spec_if_as_built_diverges: true` |
| Functional spec already current → record verification, no reroute | `updates_functional_spec_if_as_built_diverges: false` |
| Internal-IT issue → spec reconciliation gate does not apply | `updates_functional_spec_if_as_built_diverges: false` |
| Plan with 2+ independent tasks → route to `subagent-driven-development` | `routes_to_subagent_driven_development: true` |
| Plan with shared-file sequential tasks → sequential, no subagent routing | `routes_to_subagent_driven_development: false` |
| Studio issue: spec missing → spec authored → execution routing fires | `routes_to_subagent_driven_development: true` |
