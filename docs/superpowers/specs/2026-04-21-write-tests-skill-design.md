# write-tests Skill — Design Spec

**Date:** 2026-04-21
**Branch:** feature/write-tests-skill-building
**Status:** Approved, ready for implementation

---

## Problem

The existing `write-tests` skill is a strong Khorikov-based test-writing reference but has three gaps:

1. **Reactive description** — only triggers when someone explicitly asks to write tests, not during feature implementation
2. **Hardcoded framework** — Commands section assumes Vitest; fails on other stacks
3. **Single-file scope** — assumes a file is handed to it; owns no discovery, no multi-file orchestration, no mode awareness

The result: agents implementing features don't invoke it, tests are written inconsistently or not at all, and the skill doesn't cover the full development lifecycle.

---

## Goals

1. Skill triggers proactively alongside `implementing-linear-issue` during any implementation
2. Skill works across the full development lifecycle: before, during, and after building
3. Skill is framework-agnostic — discovers the test runner from project files
4. Skill delegates to existing superpowers skills rather than reinventing covered disciplines
5. Evals validate co-triggering behaviour and standalone test-writing contract

---

## What Does Not Change

The Khorikov core is correct and stays exactly as-is:

- 4 Pillars table (regression protection, refactoring resistance, fast feedback, maintainability)
- Classification quadrant (Domain / Controller / Trivial / Overcomplicated / LLM-boundary)
- 5-step workflow (classify → audit → behaviours → write → run + report)
- Managed vs unmanaged mocking rules
- Assertion style hierarchy (output > state > communication)
- Humble Object recommendation for overcomplicated code
- Lifecycle boundary checklists
- All reference files under `references/`

---

## Changes to SKILL.md

### 1. Description rewrite

**Before:**
```
Use when writing, reviewing, or auditing unit/integration tests for deterministic
frontend or backend code. Also use when tests are brittle, over-mocked, coupled to
implementation details, or when classifying code for testability before writing assertions.
```

**After:**
```
Use when implementing any feature or fixing any bug — to write, plan, or improve tests
at any stage of development. Also use when tests are brittle, over-mocked, coupled to
implementation details, or when auditing test coverage after a feature is built.
```

Rationale: mirrors `superpowers:test-driven-development` trigger pattern so both skills
fire together during implementation. Removes "frontend or backend" framing — framework-neutral.

---

### 2. Mode detection (new — first action)

The skill's first action: detect mode, activate only the relevant workflow.

```
"I'm about to build X"        → TDD mode
"I'm currently building X"    → While-building mode
"I just finished building X"  → Post-feature mode
"Update/fix existing tests"   → Update mode
"Review test quality"         → Review mode
Unclear                       → Ask one question (mode only)
```

One question maximum. Never ask mode AND scope together.

---

### 3. Phase 0: Discovery (new — runs before Step 1 in all modes)

Before any classification, discover what needs testing:

```
1. git diff origin/main --name-only   → changed source files
2. Linear issue (if context present)  → intended scope
3. Explicit file/feature from user    → direct target
4. Codebase search (fallback)         → grep for related modules
```

Output: ranked file list — Domain first, Controller second, Trivial skipped.
Present to user before proceeding:

> "Found 4 files to test. Proposed order: `parse-sse.ts` (Domain),
> `chat-stream.ts` (Controller), `config.ts` (Trivial — skip). Proceed?"

---

### 4. Mode-specific workflows (new section, per mode)

**TDD mode**
- Invoke `superpowers:test-driven-development` for RED→GREEN→REFACTOR discipline
- Apply Khorikov 4 Pillars as the quality layer within each TDD cycle
- Classification quadrant determines test type before writing the first line

**While-building mode**
- After each implementation slice, run the test for that slice immediately
- If red after implementation: surface now, don't accumulate
- Report: slice name → status → next slice

**Post-feature mode**
- Run Phase 0 discovery
- Apply 5-step workflow per file in Domain→Controller priority
- After all files: scan for coverage gaps (untested code paths), flag with suggested scenario

**Update mode**
- Before touching anything: map which existing tests cover changed files (regression surface)
- Audit those tests against 4 Pillars
- Improve in-place (not flag-and-stop): propose specific changes → get approval → apply

**Review mode**
- Check test naming: behaviour descriptions, not method names
- Flag slow tests: >5s unit, >30s integration
- Flag `sleep`/`setTimeout` as flaky candidates
- For deep quality review: hand off to `engineering-skills:adversarial-review`

---

### 5. Cross-skill handoffs (new section)

| When | Invoke |
|---|---|
| Code too complex to classify | `engineering-skills:explaining-code` → return, continue classification |
| TDD mode entry | `superpowers:test-driven-development` (process) + Khorikov (quality) |
| All tests pass, ready to merge | Signal to `engineering-skills:raising-linear-pr` |
| Deep adversarial test review | `engineering-skills:adversarial-review` |
| Unexpected failure, unclear root cause | `superpowers:systematic-debugging` |
| Claiming all tests pass | `superpowers:verification-before-completion` first |

**Standards overlap:** `superpowers:test-driven-development` owns process discipline (when/how to approach writing tests). Khorikov owns quality standards (what makes a test good). No conflict — complementary layers. The write-tests skill references TDD for the process and applies Khorikov on top for quality.

---

### 6. Framework detection (replaces hardcoded Commands section)

Discovery order:
```
1. repo-map.json         → test_frameworks field
2. package.json          → scripts.test, devDependencies (vitest / jest / mocha)
3. pyproject.toml        → pytest
4. pytest.ini / setup.cfg → pytest
5. Makefile              → test target
6. Ask user              → last resort
```

Never hardcode a runner. Discover once per session, confirm with user if ambiguous.

---

## Evals

### Standalone write-tests evals (promptfoo package)

Convert existing `skills/write-tests/evals/evals.json` scenarios to promptfoo YAML + create
fixture source files for each.

**Scenario 1 — `audit-over-mocked-integration-test`**
Fixture: `src/order-service.ts` (Controller, manages DB + event bus) +
`src/__tests__/order-service.test.ts` (over-mocked, asserts on `mockDb.prepare` calls).

Assertions:
- Posts 5-step checklist via TodoWrite
- Audits existing test before proposing new ones (Step 2 not skipped)
- Identifies `mockDb` as managed dependency violation (Pillar 2)
- Identifies `toHaveBeenCalled` assertions as implementation-detail coupling
- Leads every user question with a recommendation
- Flags `order-service.test.ts` for rename to `.integration.test.ts`

**Scenario 2 — `stateful-hook-with-lifecycle`**
Fixture: `src/use-poll-status.ts` (React hook, polls endpoint on interval).

Assertions:
- Classifies as Controller (stateful, fetch + timer collaborators)
- Surfaces unmount-cleanup lifecycle scenario
- Leads with recommended behaviour list (not open-ended question)
- Written test mocks only fetch + timers (unmanaged), not hook internals
- Uses `renderHook` + `unmount()` for lifecycle verification
- Test file named `use-poll-status.integration.test.ts`

**Scenario 3 — `domain-with-latent-bug`**
Fixture: `src/calculate-discount.ts` (pure function, gold-tier cap bug: applies 15% without
honouring the $500 cap).

Assertions:
- Classifies as Domain, prescribes unit test (no mocks)
- Proposes gold-tier $500 cap as contract-critical scenario
- Asserts desired behaviour (cap at $500) not current buggy behaviour
- Test fails red when run — reported as bug discovered, source not fixed

### Co-trigger evals (new promptfoo package)

Two scenarios that give an implementation prompt and assert both skills fire.

**Scenario A — Linear implementation prompt**
Prompt: "Implement Linear issue ENG-1023 — add rate limiting to the public API endpoints."

Assertions (tool-call evidence):
- Agent reads `skills/implementing-linear-issue/SKILL.md`
- Agent reads `skills/write-tests/SKILL.md`

Assertions (behavioural):
- Agent proposes branch + worktree setup (implementing-linear-issue behaviour)
- Agent proposes a test behaviour list or invokes TDD mode (write-tests behaviour)

**Scenario B — Generic implementation prompt**
Prompt: "Add input validation to the user signup endpoint — reject missing email and
passwords under 8 characters."

Same dual assertions (tool-call + behavioural). No Linear context — validates the
generic trigger path.

---

## Files Changed

| File | Change |
|---|---|
| `skills/write-tests/SKILL.md` | Description rewrite + mode detection + Phase 0 + mode workflows + cross-skill handoffs + framework detection |
| `skills/write-tests/evals/evals.json` | Source of truth for standalone scenarios (kept, drives YAML generation) |
| `skills/write-tests/evals/fixtures/eval-1-audit-over-mocked/` | New: `order-service.ts` + `order-service.test.ts` |
| `skills/write-tests/evals/fixtures/eval-2-stateful-hook/` | New: `use-poll-status.ts` |
| `skills/write-tests/evals/fixtures/eval-3-domain-with-bug/` | New: `calculate-discount.ts` |
| `tests/evals/packages/write-tests/` | New: promptfoo YAML for standalone scenarios |
| `tests/evals/packages/write-tests-co-trigger/` | New: promptfoo YAML for co-trigger scenarios |
| `tests/evals/prompts/skill-write-tests.txt` | New: standalone eval prompt |
| `tests/evals/prompts/skill-write-tests-co-trigger.txt` | New: co-trigger eval prompt |
| `tests/evals/assertions/check-write-tests-contract.js` | New: standalone assertions |
| `tests/evals/assertions/check-write-tests-co-trigger.js` | New: co-trigger assertions |
| `tests/evals/skill-eval-coverage-baseline.json` | Remove `write-tests` from uncovered list |
| `repo-map.json` | Update eval_harness description |
| `AGENTS.md` | Already updated (write-tests entry present) |

---

## Success Criteria

1. Agent given "implement this feature" reads both `implementing-linear-issue/SKILL.md` and `write-tests/SKILL.md`
2. Agent given "write tests for this feature" runs Phase 0 discovery before asking for a file
3. Agent in TDD mode references `superpowers:test-driven-development` and applies Khorikov pillars
4. Agent in Update mode maps regression surface before proposing changes
5. Co-trigger eval passes both tool-call evidence and behavioural assertions
6. `npm run eval:coverage` passes with `write-tests` removed from uncovered baseline
