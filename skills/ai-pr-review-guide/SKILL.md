---
name: ai-pr-review-guide
description: Use when reviewing a vd-studio pull request as the automated AI PR reviewer (OpenHands pr-review plugin) — judging test coverage for a diff, structuring the review report, or deciding merge readiness.
---

# AI PR Review Guide

## Overview

Studio-specific review contract for the automated PR reviewer. Supplements the
OpenHands plugin's default `code-review` skill: the default owns general review
judgment (bugs, security, taste); this skill owns the four test-coverage
checks, the fixed report format, the merge-readiness verdict, and the posting
contract.

**Maintenance:** the master and its evals live in
`engineering-skills/skills/ai-pr-review-guide/` (see `references/maintenance.md`
there); the copy deployed in vd-studio at `.agents/skills/ai-pr-review-guide.md`
is synced byte-for-byte from it. Edit only the master, run its evals, re-sync
(AD-55).

# Test-coverage review (mandatory, four independent checks)

The test architecture is defined in vd-studio's
`docs/design/test-architecture/README.md`: tests target the features in
`docs/functional/`, not code shape, and the deep-flow layer is the main one.
Evaluate each area below SEPARATELY and INDEPENDENTLY against the PR diff, and
include a verdict for each in the review summary even when it passes. Judge by
what the diff changes, not by whether some test file was touched.

## 1. Unit + component coverage

Co-located `__tests__/` next to source. Looking at the diff: does new or changed
logic (branches, calculations, error handling, state transitions) have unit
tests? Does new or changed UI behaviour (button/form/panel) have component
tests (jsdom)? Flag net-new logic or UI behaviour shipping without them.
Config, type-only, and cosmetic changes need none.

## 2. Deep-flow coverage (the main lane)

Flow specs live in `tests/flows/__tests__/*.flow.spec.ts` (Vitest + supertest:
real backend, real DB, real agent runtime; LLM and outside services faked via
`tests/twins/`). Looking at the diff: does it change feature behaviour —
backend API, authorization/RBAC, persistence, audit, domain/intent lifecycle,
source/platform setup? If yes, a flow spec should have been added or updated —
flag if not, and when you flag, name the gap (see "Naming the gap when a lane
flags"). If the diff changes an outside-service integration, the matching
twin in `tests/twins/` likely needs updating too.

## 3. UI journey coverage (deliberately few — do not over-ask)

Journey specs live in `tests/e2e/journeys/*.journey.spec.ts` (hermetic
Playwright, curated to the main user-facing screen flows). Expect a journey
addition ONLY when the diff adds or materially changes a main user-facing
screen flow. Do NOT request a journey for every feature PR — per the test
architecture, 1:1 journey-per-feature is an explicit anti-pattern; deep flows
own the behaviour. When a journey verdict does flag, name the gap (see "Naming
the gap when a lane flags").

BDD suites live in the sibling repository `vd-e2e-bdd` and are never expected
in this repository.

A feature diff that touches none of the applicable lanes above needs an
explicit justification in the PR description — otherwise flag it.

## 4. No integration tests

There is no integration tier; cross-module behaviour is covered by deep-flow
(check 2). Judge each added/changed test by its **code, not its filename** — flag
any test whose body boots the full app/router, hits a real DB/HTTP/filesystem/
external service, or wires several real modules together end-to-end, in ANY file
(a `*.test.ts(x)` unit file, a `*.integration.test.*` file, anything). A unit test
using one real managed dep it owns (its store, an in-process DB) is fine; the line
is cross-module / full-app / real-I/O wiring. When flagging, say where it goes:
deep-flow for cross-module, unit for pure logic.

Verdict for this lane: `flag` if the diff adds or changes an integration test;
`pass` if the diff adds or changes any test file and none are integration
tests (a one-line edit to an existing unit test still counts as a changed test
file); `n/a` only when the diff adds or changes no test file at all.

# Naming the gap when a lane flags

A flagged Flow or Journey lane must name the gap — never a vague "add a test"
and never a menu of speculative scenarios (authors ignore those). The gap is
**diff-scoped**: a specific behaviour THIS PR changed that has no test. Never
report pre-existing coverage gaps for behaviour the PR did not touch, even when
the area is under-covered overall.

This rides entirely on checks 2 and 3 — it adds no new reason to flag. A lane
is binary: `pass`, or `flag` with a named gap (`n/a` when the lane does not
apply). Do not name a spec file for a lane that did not flag.

When check 2 (Flow) or check 3 (Journey) flags, then for each touched
functional area (cap at 3):

1. Map the changed paths to a functional area and its spec files using the
   reviewed repo's own index files: `repo-map.json` (path → module), then
   `test-map.json` and `docs/functional/README.md` (module → area and its
   flow/journey specs).
2. Read that area's `docs/functional/<area>/README.md` only enough to name the
   changed behaviour precisely. Do not read module source beyond the diff or
   crawl unrelated specs — this review runs under a time budget.
3. Under the flagged lane's line in the Test Coverage block, add one nested
   bullet per uncovered changed behaviour, naming the target spec file (an
   existing one to extend, or the conventional
   `tests/flows/__tests__/<area>.flow.spec.ts` /
   `tests/e2e/journeys/<area>.journey.spec.ts` path) and the specific
   behaviour. For example:

   - Flow: flag — `domains` change has no deep-flow coverage.
     - `tests/flows/__tests__/domain-crud.flow.spec.ts`: DELETE /domains/:id with child intents is not exercised (assert 409, nothing deleted)

4. If the path → area mapping is ambiguous (a cross-cutting change), name the
   2–3 candidate spec files instead of guessing one.
5. Beyond 3 flagged areas, stop listing and write: `N more areas flagged — narrow the PR or see test-map.json`.
6. Do not repeat a gap already named in an earlier review round unless the new
   commit adds further uncovered behaviour (see the posting contract's
   review-history rule).

# Review report format (use this exact structure every time)

The top-level review body MUST follow this template, in this order:

```
## Review Summary
<1-3 sentences on what the PR does and the overall assessment>

## Findings
<one bullet per finding posted inline, with severity — or "None.">

## Test Coverage
- Unit: <pass | flag | n/a> — <one line>
- Flow: <pass | flag | n/a> — <one line>
- Journey: <pass | flag | n/a> — <one line>
- Integration: <pass | flag | n/a> — <one line>

VERDICT: READY TO MERGE
```

When a lane flags, its `Test Coverage` line may carry nested sub-bullets
naming the gap and target spec file (see "Naming the gap when a lane flags").
The four sections and the final `VERDICT:` line stay in this exact order.

The last line is the merge-readiness verdict, exactly one of (verbatim,
machine-readable):

- `VERDICT: READY TO MERGE` — all coverage verdicts pass/n-a, the diff's tests pass (a known-failing or unjustified-skip test blocks), and no critical or major findings.
- `VERDICT: NOT READY — <n> finding(s) to address`

A review without this structure and verdict line is incomplete.

# Posting contract

Post via `gh api`, never as a text response. The summary report is **one
top-level comment per commit** — never inline, never duplicated. Inline comments
are the default `code-review` plugin's per-finding comments only. Post the
summary even with no new findings ("Findings: None" + `VERDICT: READY TO
MERGE`); skip re-posting already-reported inline comments, never skip the
summary. On post failure, retry twice, then post a plain summary fallback and
report the error.
