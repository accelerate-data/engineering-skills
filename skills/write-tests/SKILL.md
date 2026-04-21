---
name: write-tests
description: Use when implementing any feature or fixing any bug — to write, plan, or improve tests at any stage of development. Also use when tests are brittle, over-mocked, coupled to implementation details, or when auditing test coverage after a feature is built.
---

# Write Tests

You write unit and integration tests using **Vladimir Khorikov's standards**. You did NOT write the code being tested — you are an independent evaluator. This skill works with any language and test runner — discover the framework from project files, never assume one.

## Mode Detection — first action always

Detect which mode applies, then activate only that workflow. Never run all modes.

```
"I'm about to build X"          → TDD mode
"I'm currently building X"      → While-building mode
"I just finished building X"    → Post-feature mode
"Update/fix existing tests"     → Update mode
"Review test quality"           → Review mode
Not clear                       → Ask one question about mode only
```

One question maximum. Never ask about mode AND scope in the same message.

## Phase 0: Discovery — runs before Step 1 in all modes

Find what needs testing before classifying anything.

Discovery order (stop when you have a file list):
1. `git diff origin/main --name-only` — changed source files on current branch
2. Linear issue body (if issue context is present) — intended scope
3. Explicit file or feature name from the user — direct target
4. Codebase search: `grep -r "featureName" src/ --include="*.ts" -l` — fallback

Filter out test files, config files, and generated files from the list.
Rank: Domain candidates first, Controller candidates second, Trivial skipped.

Present before proceeding:
> "Found N files to test. Proposed order: `file-a.ts` (Domain), `file-b.ts` (Controller),
> `config.ts` (Trivial — skip). Proceed?"

Do not start Step 1 without a confirmed file list.

## Core philosophy

**Tests assert desired behaviour, not current behaviour.** Ask: "what *should* this code do?" — not "what *does* this code do?". If the code has a bug, your test fails red naturally. That failing test is the most valuable output of this skill — it found a real bug. **Never weaken a test to make it pass against buggy code.** This skill does not fix source code — it reports the red test and stops.

**Write tests from the caller's perspective (black-box).** Read the implementation only to classify the code and discover collaborators. Never derive assertions from internal structure.

**Every question to the user leads with your recommendation.** The user's job is to approve, edit, or reject — not to generate the answer from scratch.

---

## The 4 Pillars (Khorikov) — every test is judged against these

| Pillar | What it means | Fails when |
|---|---|---|
| **1. Protection against regressions** | Catches real bugs. "What breaks if I delete this code?" has a clear answer. | Assertion is trivial (`toBeInTheDocument()` alone) or circular (asserts on your own stub). |
| **2. Resistance to refactoring** | Breaks only when observable behaviour changes, not when code is restructured. **Never compromise this.** | Asserts on implementation details (`toHaveBeenCalledWith` for internal calls, mocks managed deps). |
| **3. Fast feedback** | Unit <5s/file, integration <30s/suite. No `sleep`, no real network. | Test uses real network, `setTimeout`, filesystem. |
| **4. Maintainability** | AAA structure, one behaviour per test, body <15 lines. | Setup longer than the test. |

A test that fails any pillar is worse than no test.

---

## Mode Workflows

### TDD mode

**REQUIRED SUB-SKILL:** Use `superpowers:test-driven-development` for the RED→GREEN→REFACTOR discipline.
Apply Khorikov's 4 Pillars as the quality layer within each TDD cycle. Run Phase 0 discovery first — classification quadrant determines test type before writing the first line.

**Phase 0 in TDD mode:** No code exists yet — use the requirement/spec to determine which file will be created and classify it (Domain vs Controller) before writing the first test. Skip git diff and codebase search steps. Khorikov classification applies to the planned code structure. The 5-step workflow runs once per RED→GREEN cycle, not once per file.

### While-building mode

After each implementation slice, run the test for that slice immediately. If still red after implementation, surface it now — do not accumulate red tests until the end.
Report format: `[slice-name] → [PASS/FAIL] → next: [next-slice-name]`

### Post-feature mode

Run Phase 0 discovery → apply the 5-step workflow per file in Domain→Controller priority order → after all files, scan for coverage gaps (code paths with no test) and flag each with a suggested scenario.

### Update mode

Before touching anything: identify which existing tests cover the changed files (regression surface). Audit those tests against the 4 Pillars. Improve in-place — propose specific changes, get approval, apply. Do not flag-and-stop.

### Review mode

Check test naming: names must describe behaviours in plain language, not method names.
Flag slow tests: >5s per unit file, >30s per integration suite.
Flag any test using `sleep` or `setTimeout` as a flaky candidate with a suggested fix.
For deep adversarial quality review: **REQUIRED SUB-SKILL:** Use `engineering-skills:adversarial-review`.

---

## Cross-skill Handoffs

| When | Action |
|---|---|
| Code too complex to classify without understanding internals | **REQUIRED SUB-SKILL:** `engineering-skills:explaining-code` → return with understanding, continue classification |
| TDD mode (before writing first test) | **REQUIRED SUB-SKILL:** `superpowers:test-driven-development` for process; apply Khorikov 4 Pillars for quality |
| All tests pass and implementation is ready to merge | Note in handoff message that tests pass; `engineering-skills:raising-linear-pr` gates on this |
| Deep adversarial review of test suite | **REQUIRED SUB-SKILL:** `engineering-skills:adversarial-review` |
| Test fails in unexpected way, root cause unclear | **REQUIRED SUB-SKILL:** `superpowers:systematic-debugging` |
| About to claim all tests pass | **REQUIRED SUB-SKILL:** `superpowers:verification-before-completion` first |

**Standards note:** `superpowers:test-driven-development` owns process discipline (when and how to approach writing tests). This skill owns quality standards (what makes a test good via Khorikov). They are complementary — no overlap.

---

## Workflow — 5 steps

At the start of every session, post this TodoWrite checklist. Skipping is visible.

```
- [ ] Step 1: Read source file + classify per export
- [ ] Step 2: Audit existing tests (if any colocated)
- [ ] Step 3: Recommend behaviours to protect → user approves
- [ ] Step 4: Write tests (domain → unit, controller → integration)
- [ ] Step 5: Run + report (red tests stay red)
```

Do not start Step 3 before Step 2's report is posted. Do not start Step 4 without an approved behaviour list.

---

### Step 1 — Read source and classify

Read the file. Understand the **public API** (exports, signatures, return types). Classify per export using the quadrant:

- **Domain** (domain significance, few collaborators) → unit test, all branches
- **Controller** (orchestrates many collaborators) → integration test, happy path
- **Trivial** (no domain significance, no collaborators) → skip
- **Overcomplicated** (high domain significance + many collaborators) → propose Humble Object refactor (see below)
- **LLM-boundary** (codebase extension, not Khorikov canon) → unit test deterministic part, mock API

Full guidance: `references/classification-guide.md`.

**Domain significance ≠ complex code.** A 3-line function enforcing a business rule is domain code. Don't mark short-but-critical code as trivial.

**Test-value ranking (spend tokens here first):** Domain > Controller > Trivial.

Output a per-export table:

```
{filename}: {file-level category} ({N} lines, {M} imports)

| Export | Category | Test type | Reason | Action |
|---|---|---|---|---|
| `parseThing` | Domain | Unit | Pure function, 4 branches | Test — `*.test.ts` |
| `useIntentManager` | Controller | Integration | 3 collaborators (store, query, API) | Happy path — `*.integration.test.ts` |
| `LABELS` | Trivial | — | Static constant | Skip |
```

**Overcomplicated → apply Humble Object.** Don't just say "refactor first". Recommend specifically:

> `{fn}` is overcomplicated ({N} lines, {M} collaborators). My recommendation: apply the **Humble Object pattern** — extract `{specific logic}` into a pure function (becomes domain code), leave the thin orchestrator behind (becomes controller). Then test both normally.
>
> - **A) Apply the refactor** (I propose the split, you approve before I write code)
> - **B) Skip this file** and come back after refactoring
> - **C) Test as-is** despite the brittleness (not recommended)
>
> **My recommendation: A.** Shall I propose the split?

Apply lifecycle-boundary checks for any export that manages state across time (refs, connections, sessions, caches, subscriptions). See `./lifecycle-checklists.md`.

---

### Step 2 — Audit existing tests

**This step is non-negotiable.** If `__tests__/` next to the source contains any files, audit each one before writing new tests. Post the audit report BEFORE asking about behaviours.

Use `references/audit-checklist.md` for the per-file checks and report template.

After auditing all existing test files, recommend a path forward:

> **Audit summary:** {N} existing test files, {M} pillar violations found.
>
> **My recommendation:** {keep / fix-in-place / rewrite + add new}. Reason: {1 sentence}.
>
> Shall I proceed with my recommendation, or do you want to choose differently?

Never silently overwrite existing tests. Never skip the audit.

**Filename convention:**
- Unit tests (no mocks): `*.test.ts`
- Integration tests (mocks for unmanaged deps): `*.integration.test.ts`

If an existing file has the wrong suffix, flag it in the audit and include the rename in your recommendation.

---

### Step 3 — Recommend behaviours, get approval

**Lead with a recommendation, always.** Never ask the user to generate a list from scratch.

Read the source, find the observable behaviours worth protecting, and present them:

> Based on the code, here are the behaviours I'd protect:
>
> | # | Behaviour (plain language) | Concrete scenario |
> |---|---|---|
> | 1 | Returns empty array when input has no complete events | `parseSSEBuffer('data: incomplete') → { events: [], remaining: 'data: incomplete' }` |
> | 2 | Parses a single complete event | `parseSSEBuffer('data: {"x":1}\n\n') → { events: [{x:1}], remaining: '' }` |
> | 3 | {lifecycle-boundary scenario if applicable} | |
>
> **Approve this list as-is? Add/remove/edit? Or tell me what's missing.**

For parsers/serializers/protocol-boundary code, also propose contract-critical edge cases (incomplete input, malformed input, empty input, repeated fields, unknown fields, mixed valid/invalid). Users don't always know to ask for these — that's your job.

For stateful code, propose lifecycle scenarios from `lifecycle-checklists.md` (unmount/remount, connection drop, cache eviction, etc.).

**False-negative check before Step 4:** Ask yourself "what plausible bug could still pass this suite?" If you can name one, add it as a proposed scenario and flag it to the user. If you can't, state that explicitly.

---

### Step 4 — Write tests

**Assertion style hierarchy — always reach for the top first:**

1. **Output-based** (pure input → return value). Most refactor-proof.
2. **State-based** (action → inspect new state). Use when no output.
3. **Communication-based** (assert on outbound call). **Last resort** — only when the call itself IS the observable behaviour (email sent, event emitted to unmanaged gateway).

Full hierarchy: `references/assertion-style-hierarchy.md`.

**Observable vs implementation:**

| Observable (assert this) | Implementation (never assert this) |
|---|---|
| `screen.getByText('Error')` | `expect(setError).toHaveBeenCalledWith(...)` |
| `expect(response.status).toBe(404)` | `expect(findById).toHaveBeenCalled()` |
| `expect(useStore.getState().id).toBe('x')` | `expect(set).toHaveBeenCalledWith({...})` |
| `expect(result).toEqual({ total: 100 })` | `expect(calculateSubtotal).toHaveBeenCalledTimes(3)` |

**Mocking rules (Khorikov's managed vs unmanaged):**

| Dependency | Mock? |
|---|---|
| External API (Anthropic, GitHub) | ✅ Unmanaged — mock |
| Browser APIs (timers, fetch) | ✅ Unavailable in test env — mock |
| Your own DB, store, service | ❌ Managed — use real (in-memory) |
| Logger | ✅ Infrastructure — mock, never assert on |

Full mock rules: `references/mock-rules.md`. Canonical test examples: `references/test-examples.md`.

**Mocking school:** This codebase follows the **Classical school** — test units of behaviour, not isolated classes. Only mock at the system boundary (unmanaged external deps). Never mock your own modules calling each other — that couples tests to the dependency graph and produces false positives on every refactor. The London school (mock every collaborator) is explicitly rejected here.

**If you find yourself mocking a managed dependency, stop.** You're testing the mock. Import the real module.

**If you find yourself writing `toHaveBeenCalledWith` on an internal helper, stop.** You're coupling to implementation. Find the real observable one layer out.

**In this project's unit tests, never use `vi.mock` or `vi.fn`.** If you need them, it's an integration test. (This is a project convention — not a universal framework rule.)

---

### Step 5 — Run and report

Run the test file. When tests fail:

1. Read the error and the failing assertion.
2. Ask: does the test assert **desired** behaviour that the code violates?
   - **Yes → bug found.** Leave the test red. Do NOT fix the test. Do NOT fix the source. Record for the report. This is the skill's most valuable output.
   - **No → the test has wrong assumptions.** Fix the test (max 3 attempts).
3. If still stuck after 3 attempts, report ambiguously with both possibilities.

Report format:

```
## Test Results

| File | Test type | Category | Tests | Pass | Fail | Skipped |
|------|-----------|----------|-------|------|------|---------|

### Audit findings (from Step 2)
- {file}: {pillar violations found + action taken}

### Bugs discovered (red tests)
- {file}:{test name} — **desired:** {what should happen}. **actual:** {what does happen}. Test left failing intentionally.

### Skipped files
- {file}: {reason}

### Rename recommendations
- {file} → {new-name}.integration.test.ts (has mocks for external deps)
```

The report must include audit findings from Step 2. If Step 2 is missing from the report, the skill workflow was violated.

---

## Framework Detection — discover before running

Never hardcode a test runner. Discover once per session:

```
1. Read repo-map.json         → check test_frameworks field
2. Read package.json          → check scripts.test and devDependencies
                                (vitest / jest / mocha / jasmine)
3. Read pyproject.toml        → pytest present?
4. Read pytest.ini or setup.cfg → pytest config?
5. Read Makefile              → test target?
6. Ask the user               → last resort only
```

Confirm with user if ambiguous (e.g. both jest and vitest in devDependencies).
Once discovered, use that runner for all test commands in the session.

**Common runners:**
| Runner | Run single file | Run suite |
|---|---|---|
| vitest | `npx vitest run {file}` | `npx vitest run` |
| jest | `npx jest {file} --no-coverage` | `npx jest --no-coverage` |
| pytest | `pytest {file} -v` | `pytest -v` |
| mocha | `npx mocha {file}` | `npx mocha` |

---

## Agent Workflow Rule

**The agent that builds the feature must NOT write its tests.**

Agents self-attest. An agent that wrote the code knows what it does and writes tests that confirm it — including bugs. It cannot see its own mistakes because it shares the same context.

**How to enforce:**
- Feature work and test work run in **separate sessions** with separate context
- The test session receives the **requirement** (what the code should do), not the implementation
- The test session reads the code fresh, like an independent reviewer

This aligns with the Planner-Generator-Evaluator pattern: the evaluator must not share context with the generator.

**In practice:** When `implementing-linear-issue` finishes, do not continue into test-writing in the same session. Hand off. A fresh session invokes `write-tests` with the requirement and the finished code — never the implementation session writing its own tests.

---

## Anti-patterns — never do these

| Anti-pattern | Why it's bad |
|---|---|
| `expect(x).toBeInTheDocument()` as only assertion | Proves nothing |
| Asserting on stubs you set up | Circular — testing your own mock setup |
| `toHaveBeenCalledWith` for internal helper calls | Couples to implementation, breaks on refactor |
| Mocking managed dependencies (own stores, services, DB) | Tests the mock, not the code |
| Using `vi.mock` in this project's unit tests | Domain code has no collaborators — if you need a mock, it's integration (project convention, not a universal rule) |
| Ask user "what should I test?" without recommending first | Every question leads with a recommendation |
| Skipping Step 2 audit | Existing tests may violate standards — audit is mandatory |
| Asserting current buggy behaviour as "expected" | Protects the bug, not the user |
| Test-per-method organisation | Organise by behaviour, not API surface |
| Test setup longer than the test | Probably overcomplicated code — apply Humble Object |

---

## Reference files (load when needed)

- `references/classification-guide.md` — full quadrant, domain-significance signals, Humble Object pattern
- `references/assertion-style-hierarchy.md` — output > state > communication, with examples
- `references/mock-rules.md` — managed vs unmanaged, stub vs mock, module-boundary mocking
- `references/test-examples.md` — canonical file structures by test type
- `references/audit-checklist.md` — full audit checks + report template
- `./lifecycle-checklists.md` — FE/BE lifecycle boundary checklists (mount/unmount, connection drop, cache eviction, etc.) — lives at the skill root, not inside `references/`
- `references/testing-standards.md` — full testing standards: 4-outcome formula (True/False Positive/Negative), Classical vs London school, when to delete tests, anti-patterns, and the agent workflow rule in depth
