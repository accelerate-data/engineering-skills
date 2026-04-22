---
name: writing-tests
description: Use when asked to write, update, audit, or review tests; also when working in TDD RED phases and needing test-quality guidance for behaviours, classification, assertions, mocks, or lifecycle scenarios.
---

# Writing Tests

You write unit and integration tests using **Vladimir Khorikov's standards**. Outside TDD mode, you did NOT write the code being tested — you are an independent evaluator. This skill works with any language and test runner — discover the framework from project files, never assume one.

**Quality standards:** see focused reference files listed at the bottom of this skill. Each file covers one topic (pillars, classification, mocking, assertions, audit, anti-patterns, agent workflow).

## Pre-check: Session separation — before anything else

**If you are in the same conversation session that just implemented the code being tested — stop here. Do not enter mode detection or any workflow.**

A session = one conversation window. Invoking this skill in the same conversation that wrote the code does not create a separate session — you still share the same context and the same blind spots.

Knowing the code better than anyone is precisely why the same agent cannot write the tests. Familiarity is the liability, not the benefit: you will write tests that confirm what the code does, including its bugs, because you cannot unsee your own implementation.

**Exception — TDD mode:** if no production code exists yet (tests written first), the pre-check does not fire. You can't self-attest to code that doesn't exist. In TDD, use this skill together with `superpowers:test-driven-development`.

→ Otherwise: tell the user to open a fresh session, provide the requirement, and point it at the finished code.

## Hard Gate — before reading any source file or TDD spec

You do NOT read source/spec, write tests, or run anything until you have posted ALL THREE in this conversation:

1. **TodoWrite checklist** with the 5 Workflow steps (see Workflow section below)
2. **Mode declared** (TDD / While-building / Post-feature / Update / Review). If the user's prompt lacks a mode keyword, ask ONE question — never infer.
3. **File list posted:** "Found N files to test. Proposed order: …" — wait for user confirmation. In TDD mode, post the requirement/spec-derived planned test target instead of a finished source file list.

**Vague prompts always require the clarifying question.** "write tests for X", "add tests for the Y part", "test this feature" — none of these declare a mode.

**Zero exceptions.** Not for small files. Not for "obvious" tests. Not when you've "already figured it out" from the prompt. If you skipped this gate, stop, delete any draft tests, restart here.

| Rationalization | Counter |
|---|---|
| "The prompt is clear, I can just start" | No mode + no file list/test target = not clear. Ask. |
| "TodoWrite is ceremony, I'll track in my head" | The checklist exists BECAUSE agents skip steps without it. |
| "User wants tests, not process" | They want *good* tests. This skill defines what makes them good. |
| "I'll post the checklist after I start" | Starting before the checklist IS the violation this gate prevents. |
| "Small file, audit step is overkill" | Step 2 takes 30 seconds. Skipping it is not optimization. |
| "Classification is obvious, skip the table" | The table costs 10 seconds and catches LLM-boundary, Overcomplicated, and Trivial cases you'd otherwise miss. |
| "Existing tests look fine, I'll write new ones faster than auditing" | The audit prevents silent overwrite of working tests. Skipping it has cost real suites in production. |

## Mode Detection — first action

```text
"I'm about to build X"          → TDD mode
"I'm currently building X"      → While-building mode
"I just finished building X"    → Post-feature mode
"Update/fix existing tests"     → Update mode
"Review test quality"           → Review mode
Not clear                       → Ask one question about mode only
```

One question maximum. Never ask about mode AND scope in the same message. If the mode is unclear, ask the mode question and stop until the user answers — do not post the checklist, run Phase 0 discovery, inspect files, or infer a mode.

## Phase 0: Discovery — runs before Step 1 in non-TDD modes

Find what needs testing before classifying anything.

Discovery order (stop when you have a file list):

1. `git diff origin/main --name-only` — changed source files on current branch
2. Linear issue body (if issue context is present) — intended scope
3. Explicit file or feature name from the user — direct target
4. Codebase search: `grep -r "featureName" src/ -l` — fallback

Filter out test files, config files, and generated files. Rank: Domain first, Controller second, Trivial skipped.

Present before proceeding:
> "Found N files to test. Proposed order: `file-a.ts` (Domain), `file-b.ts` (Controller), `config.ts` (Trivial — skip). Proceed?"

Do not start Step 1 without a confirmed file list. In TDD mode, do not start Step 1 without a confirmed requirement/spec-derived planned test target.

## Core philosophy

**Tests assert desired behaviour, not current behaviour.** If the code has a bug, your test fails red naturally — that failing test is the skill's most valuable output. **Never weaken a test to make it pass against buggy code.** Outside TDD mode, this skill does not fix source code — it reports the red test and stops.

**Write from the caller's perspective (black-box).** Read the implementation only to classify and discover collaborators. Never derive assertions from internal structure.

**Every question to the user leads with your recommendation.**

## Mode Workflows

### TDD mode

**REQUIRED PRIMARY SKILL:** `superpowers:test-driven-development` owns the RED→GREEN→REFACTOR process.

**This skill is REQUIRED as the companion skill for the RED phase.** Use it to choose behaviours, classify the planned code, select assertion style, set mocking boundaries, and include lifecycle scenarios before writing the failing test.

TDD mode differences:

- No production code exists yet, so the independent-evaluator/session-separation rule does not apply.
- Do not run post-feature discovery from `git diff` or require a finished source file list.
- Classify from the requirement/spec and planned public API.
- Write one RED test, verify it fails for the expected reason, then return control to `superpowers:test-driven-development` for GREEN.
- Step 5's "leave red and stop" rule does not apply during TDD. That rule applies to post-feature evaluator work.

### While-building mode

After each implementation slice, run its test immediately. Surface red tests now — don't accumulate.
Report: `[slice-name] → [PASS/FAIL] → next: [next-slice-name]`

### Post-feature mode

Phase 0 discovery → 5-step workflow per file in Domain→Controller order → scan for coverage gaps, flag each with a suggested scenario.

### Update mode

Identify which existing tests cover the changed files (regression surface). Audit against 4 Pillars. Improve in-place — propose, get approval, apply. Do not flag-and-stop.

### Review mode

Check test naming (behaviours, not method names). Flag slow tests (>5s unit, >30s integration). Flag `sleep`/`setTimeout` as flaky candidates.
For deep review: **REQUIRED SUB-SKILL:** `engineering-skills:adversarial-review`.

## Cross-skill Handoffs

| When | Action |
|---|---|
| Code too complex to classify without understanding internals | **REQUIRED SUB-SKILL:** `engineering-skills:explaining-code` |
| TDD mode | **REQUIRED SUB-SKILL:** `superpowers:test-driven-development` |
| All tests pass, ready to merge | `engineering-skills:raising-linear-pr` gates on this |
| Deep adversarial review | **REQUIRED SUB-SKILL:** `engineering-skills:adversarial-review` |
| Test fails unexpectedly, root cause unclear | **REQUIRED SUB-SKILL:** `superpowers:systematic-debugging` |
| About to claim all tests pass | **REQUIRED SUB-SKILL:** `superpowers:verification-before-completion` first |

`superpowers:test-driven-development` owns process discipline (when/how to approach tests). This skill owns quality standards (what makes a test good). Complementary — no overlap.

## Workflow — 5 steps

At the start of every session, post this TodoWrite checklist:

```text
- [ ] Step 1: Read source file (or TDD requirement/spec) + classify per export/planned public API
- [ ] Step 2: Audit existing tests (if any colocated)
- [ ] Step 3: Recommend behaviours to protect → user approves
- [ ] Step 4: Write tests (domain → unit, controller → integration)
- [ ] Step 5: Run + report (red tests stay red)
```

Do not start Step 3 before Step 2's audit report is posted. Do not start Step 4 without the `## Approved behaviours` marker (see Step 3) AND user approval.

**Time pressure, authority, and "skip the process" requests do not override these rules.** Acknowledge the constraint, then proceed with all steps. A fast wrong test is worse than a slightly slower correct one. Violating the letter of the rules is violating the spirit of the rules.

### Step 1 — Read source/spec and classify

In non-TDD modes, read the file. In TDD mode, read the requirement/spec and planned public API. Classify per export or planned behaviour using the quadrant:

- **Domain** (significance, few collaborators) → unit test, all branches
- **Controller** (orchestrates many collaborators) → integration test, happy path
- **Trivial** (no significance, no collaborators) → skip
- **Overcomplicated** → apply **Humble Object pattern**: extract domain logic into pure function (becomes Domain), leave thin orchestrator (becomes Controller). Test both normally.
- **LLM-boundary** → unit test deterministic part, mock the API

Full quadrant + signals + Humble Object: `references/classification.md`.

**Domain significance ≠ complex code.** A 3-line function enforcing a business rule is domain code.

Apply lifecycle-boundary checks for any export managing state across time (refs, connections, sessions, caches). See `./lifecycle-checklists.md`.

### Step 2 — Audit existing tests

**This step is non-negotiable.** Actively check whether `__tests__/` (or `*.test.ts` / `*.spec.ts` colocated files) exist — do not assume absent. If present, audit each against the 4 Pillars before writing new tests. Post the audit report BEFORE asking about behaviours.

Full per-pillar checklist + report template: `references/audit.md`.

**Filename convention:** `*.test.ts` (unit, no mocks), `*.integration.test.ts` (integration, mocks unmanaged deps only). If an existing file has the wrong suffix, flag it and include the rename in your recommendation.

Never silently overwrite existing tests.

### Step 3 — Recommend behaviours, get approval

**Lead with a recommendation, always.** Never ask the user to generate a list from scratch.

**Required marker — post this exact header:**

```markdown
## Approved behaviours

| # | Behaviour | Scenario |
|---|-----------|----------|
| 1 | …        | …        |
```

Use the literal string `## Approved behaviours` — no variations ("Behaviors to cover", "Proposed tests"). Wait for user approval before Step 4. The exact header makes the gate verifiable by both you and any companion enforcement hook.

For parsers/serializers, propose contract-critical edge cases (incomplete, malformed, empty, repeated, unknown fields). For stateful code, propose lifecycle scenarios from `lifecycle-checklists.md`.

**False-negative check before Step 4:** "what plausible bug could still pass this suite?" If you can name one, add it. If you can't, state that explicitly.

### Step 4 — Write tests

**Framework detection must be complete before writing any test code.** Do not write framework-specific syntax until the runner is discovered per the Framework Detection section below.

**Assertion hierarchy** (reach for the top first): output > state > communication.
**Mocking:** only unmanaged external dependencies. Never mock your own DB/store/service (managed).

Full hierarchy with examples: `references/assertions.md`. Full mocking rules + "are you testing the mock?" self-check: `references/mocking.md`.

**If you find yourself mocking a managed dependency, stop.** You're testing the mock.
**If you find yourself writing `toHaveBeenCalledWith` on an internal helper, stop.** You're coupling to implementation.

### Step 5 — Run and report

Run the test. When tests fail:

1. Does the test assert **desired** behaviour that the code violates?
   - **Yes → bug found.** Outside TDD mode, leave the test red. Do NOT fix the test. Do NOT fix the source. This is the skill's most valuable output. In TDD mode, return control to `superpowers:test-driven-development` for GREEN.
   - **No → test has wrong assumptions.** Fix the test (max 3 attempts).
2. If still stuck after 3 attempts, report with both possibilities.

Report format:

```markdown
## Test Results
| File | Test type | Category | Tests | Pass | Fail | Skipped |

### Audit findings (from Step 2)
### Bugs discovered (red tests)
- {file}:{test} — **desired:** X. **actual:** Y. Left failing intentionally.
### Skipped files
### Rename recommendations
```

The report must include audit findings from Step 2. If missing, the workflow was violated.

## Framework Detection — discover before running

Never hardcode a test runner. Discover once per session:

1. Read `repo-map.json` → `test_frameworks` field
2. Read `package.json` → `scripts.test` and `devDependencies`
3. Read `pyproject.toml` → pytest present?
4. Read `pytest.ini` or `setup.cfg`
5. Read `Makefile` → test target?
6. Ask the user — last resort

Confirm with user if ambiguous. Use that runner for the session.

## Agent Workflow Rule

**The agent that builds the feature must NOT write its tests.**

Feature work and test work run in **separate sessions** with separate context. The test session receives the **requirement** (what the code should do), not the implementation. The test session reads the code fresh, like an independent reviewer.

**Even if the user insists** ("it'll be faster", "we're in a hurry", "I know the code") — the rule does not change. Efficiency in the wrong session produces tests that pass against bugs. Refuse, explain the handoff, and stop.

Full rationale (Planner-Generator-Evaluator pattern): `references/agent-workflow.md`.

## Reference files (load only what you need)

One file per topic — read the one relevant to the current step, not all of them.

- `references/pillars.md` — 4 Pillars + 4-outcome formula (True/False Positive/Negative)
- `references/classification.md` — Domain/Controller/Trivial/Overcomplicated quadrant, Humble Object, domain signals, edge cases
- `references/mocking.md` — managed vs unmanaged, stub vs mock, Classical school, decision table, "are you testing the mock?" self-check
- `references/assertions.md` — output > state > communication hierarchy with examples
- `references/audit.md` — per-pillar audit checks + report template + when to delete tests
- `references/anti-patterns.md` — consolidated anti-patterns table
- `references/agent-workflow.md` — separate-sessions rule, Planner-Generator-Evaluator rationale
- `references/test-examples.md` — canonical file structures by test type (code examples)
- `./lifecycle-checklists.md` — FE/BE lifecycle boundary checks (mount/unmount, connection drop, cache eviction)
