# write-tests Skill Improvement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the `write-tests` skill to trigger proactively during feature implementation, work across the full development lifecycle, be framework-agnostic, and validate co-triggering with `implementing-linear-issue` via evals.

**Architecture:** The Khorikov core (4 Pillars, classification quadrant, 5-step workflow, all reference files) stays unchanged. New content wraps around it: mode detection at entry, Phase 0 discovery, mode-specific workflows, cross-skill handoffs, and framework detection. Evals are split into two promptfoo packages — standalone skill contract and co-trigger with `implementing-linear-issue`.

**Tech Stack:** Markdown (skill content), TypeScript (eval fixtures), JavaScript (promptfoo assertions), YAML (promptfoo configs), promptfoo eval harness

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `skills/write-tests/SKILL.md` | Modify | Description, mode detection, Phase 0, mode workflows, cross-skill handoffs, framework detection, agent workflow rule, classical school note, testing-standards.md reference |
| `skills/write-tests/references/testing-standards.md` | Already exists | Full testing standards depth reference — added by user, referenced from SKILL.md |
| `skills/write-tests/evals/fixtures/eval-1-audit-over-mocked/src/order-service.ts` | Create | Controller fixture with managed DB + event bus deps |
| `skills/write-tests/evals/fixtures/eval-1-audit-over-mocked/src/__tests__/order-service.test.ts` | Create | Over-mocked test asserting on internal calls |
| `skills/write-tests/evals/fixtures/eval-2-stateful-hook/src/use-poll-status.ts` | Create | React hook fixture polling endpoint on interval |
| `skills/write-tests/evals/fixtures/eval-3-domain-with-bug/src/calculate-discount.ts` | Create | Pure function with latent gold-tier cap bug |
| `tests/evals/prompts/skill-write-tests-audit.txt` | Create | Prompt for eval-1 (audit over-mocked) |
| `tests/evals/prompts/skill-write-tests-lifecycle.txt` | Create | Prompt for eval-2 (stateful hook lifecycle) |
| `tests/evals/prompts/skill-write-tests-bug.txt` | Create | Prompt for eval-3 (domain with latent bug) |
| `tests/evals/prompts/skill-write-tests-co-trigger.txt` | Create | Prompt for co-trigger (both skills fire) |
| `tests/evals/assertions/check-write-tests-contract.js` | Create | Assertions for standalone scenarios |
| `tests/evals/assertions/check-write-tests-co-trigger.js` | Create | Assertions for co-trigger scenarios |
| `tests/evals/packages/write-tests/skill-write-tests.yaml` | Create | promptfoo config for standalone scenarios |
| `tests/evals/packages/write-tests-co-trigger/skill-write-tests-co-trigger.yaml` | Create | promptfoo config for co-trigger scenarios |
| `tests/evals/skill-eval-coverage-baseline.json` | Modify | Remove `write-tests` from uncovered list |
| `repo-map.json` | Modify | Update eval_harness description (13 → 14 eval packages) |

---

## Task 1: Baseline — document current skill failures (writing-skills RED phase)

**Purpose:** Before touching SKILL.md, prove what the current skill fails to do. This is the RED phase of the writing-skills TDD cycle.

**Files:** none (subagent observation only)

- [ ] **Step 1: Run baseline subagent without improved skill**

Spawn a subagent with this prompt and record the exact output:

```
You are about to implement a new feature.

Read the skill at `skills/write-tests/SKILL.md`.

Scenario: A developer says "I'm building the rate-limiting feature for the public API."
No file has been handed to you. No explicit "write tests" instruction was given.

Answer these questions based ONLY on what the skill tells you:
1. Do you know what mode you are in?
2. Do you know which files need tests?
3. What is the first thing you do?
4. What test runner do you use?

Return JSON:
{
  "knows_mode": true/false,
  "knows_which_files": true/false,
  "first_action": "string describing what you do first",
  "test_runner": "string — what runner you would use",
  "notes": "string"
}
```

- [ ] **Step 2: Record baseline failures**

Expected failures (document what the subagent actually returns):
- `knows_mode`: false — current skill has no mode detection
- `knows_which_files`: false — current skill has no discovery phase
- `first_action`: will describe reading a file that was handed to it, not discovering files
- `test_runner`: "vitest" — hardcoded in Commands section

Record the verbatim `notes` field — these are the rationalizations to address in the rewrite.

- [ ] **Step 3: Commit baseline record**

```bash
cd /Users/arpit/Code/AccelerateDataAI/worktrees/feature/write-tests-skill-building
git add -A
git commit -m "docs: record write-tests skill baseline failures (writing-skills RED)"
```

---

## Task 2: Rewrite SKILL.md (writing-skills GREEN phase)

**Files:**
- Modify: `skills/write-tests/SKILL.md`

- [ ] **Step 1: Replace the frontmatter description**

In `skills/write-tests/SKILL.md`, replace lines 1–4:

```markdown
---
name: write-tests
description: Use when implementing any feature or fixing any bug — to write, plan, or improve tests at any stage of development. Also use when tests are brittle, over-mocked, coupled to implementation details, or when auditing test coverage after a feature is built.
---
```

- [ ] **Step 2: Replace the opening line (framework-neutral)**

Replace:
```markdown
You write unit and integration tests for deterministic FE/BE code using **Vladimir Khorikov's standards**. You did NOT write the code being tested — you are an independent evaluator.
```

With:
```markdown
You write unit and integration tests using **Vladimir Khorikov's standards**. You did NOT write the code being tested — you are an independent evaluator. This skill works with any language and test runner — discover the framework from project files, never assume one.
```

- [ ] **Step 3: Add Mode Detection section — insert after the opening line, before Core philosophy**

```markdown
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
```

- [ ] **Step 4: Add Phase 0: Discovery section — insert after Mode Detection, before The 4 Pillars**

```markdown
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
```

- [ ] **Step 5: Add Mode Workflows section — insert after The 4 Pillars table, before Workflow — 5 steps**

```markdown
## Mode Workflows

### TDD mode
**REQUIRED SUB-SKILL:** Use `superpowers:test-driven-development` for the RED→GREEN→REFACTOR discipline.
Apply Khorikov's 4 Pillars as the quality layer within each TDD cycle. Run Phase 0 discovery first — classification quadrant determines test type before writing the first line.

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
```

- [ ] **Step 6: Add Cross-skill Handoffs section — insert after Mode Workflows, before The 4 Pillars**

```markdown
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
```

- [ ] **Step 7: Replace Commands section with Framework Detection**

Replace the entire `## Commands` section:

```markdown
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
```

- [ ] **Step 8: Add Agent Workflow Rule — insert before Anti-patterns section**

```markdown
## Agent Workflow Rule

**The agent that builds the feature must NOT write its tests.**

Agents self-attest. An agent that wrote the code knows what it does and writes tests that
confirm it — including bugs. It cannot see its own mistakes because it shares the same context.

**How to enforce:**
- Feature work and test work run in **separate sessions** with separate context
- The test session receives the **requirement** (what the code should do), not the implementation
- The test session reads the code fresh, like an independent reviewer

This aligns with the Planner-Generator-Evaluator pattern: the evaluator must not share
context with the generator.

**In practice:** When `implementing-linear-issue` finishes, do not continue into test-writing
in the same session. Hand off. A fresh session invokes `write-tests` with the requirement
and the finished code — never the implementation session writing its own tests.
```

- [ ] **Step 9: Add Classical school note — insert into the mocking rules table in Step 4 (Write tests)**

After the existing mocking rules table in Step 4, add:

```markdown
**Mocking school:** This codebase follows the **Classical school** — test units of behaviour,
not isolated classes. Only mock at the system boundary (unmanaged external deps). Never mock
your own modules calling each other — that couples tests to the dependency graph and produces
false positives on every refactor. The London school (mock every collaborator) is explicitly
rejected here.
```

- [ ] **Step 10: Add testing-standards.md to Reference files section**

In the `## Reference files (load when needed)` section at the bottom of SKILL.md, add:

```markdown
- `references/testing-standards.md` — full testing standards: 4-outcome formula (True/False Positive/Negative), Classical vs London school, when to delete tests, anti-patterns, and the agent workflow rule in depth
```

- [ ] **Step 11: Verify the file reads cleanly end-to-end**

```bash
cd /Users/arpit/Code/AccelerateDataAI/worktrees/feature/write-tests-skill-building
head -5 skills/write-tests/SKILL.md
# Should show new description in frontmatter

grep -n "## Mode Detection" skills/write-tests/SKILL.md
grep -n "## Phase 0" skills/write-tests/SKILL.md
grep -n "## Mode Workflows" skills/write-tests/SKILL.md
grep -n "## Cross-skill Handoffs" skills/write-tests/SKILL.md
grep -n "## Framework Detection" skills/write-tests/SKILL.md
grep -n "## Agent Workflow Rule" skills/write-tests/SKILL.md
grep -n "## The 4 Pillars" skills/write-tests/SKILL.md
grep -n "## Workflow" skills/write-tests/SKILL.md
grep -n "testing-standards.md" skills/write-tests/SKILL.md
# All sections must appear; testing-standards.md must be in references
```

- [ ] **Step 12: Commit**

```bash
git add skills/write-tests/SKILL.md
git commit -m "feat(write-tests): rewrite skill — mode detection, discovery, agent workflow rule, framework-agnostic"
```

---

## Task 3: Verify SKILL.md (writing-skills GREEN verification)

**Files:** none (subagent observation only)

- [ ] **Step 1: Run the same baseline scenario with the new skill**

Spawn a subagent with the identical prompt from Task 1 Step 1. Expected JSON now:

```json
{
  "knows_mode": true,
  "knows_which_files": false,
  "first_action": "run git diff origin/main --name-only to find changed files",
  "test_runner": "discover from repo-map.json or package.json",
  "notes": "..."
}
```

`knows_which_files` is false because no branch context — that's correct. The skill no longer hardcodes `vitest`. `first_action` must describe discovery, not waiting for a file.

- [ ] **Step 2: Run a second scenario — post-feature with git context**

Spawn a subagent:

```
You just finished implementing a feature on a git branch.
Read the skill at `skills/write-tests/SKILL.md`.

Scenario: You are on branch feature/rate-limiting. git diff origin/main shows
three changed files: src/rate-limiter.ts, src/middleware/rate-limit.ts, src/config/limits.ts.

Answer:
1. What mode are you in?
2. What is Phase 0 output for this scenario?
3. What order do you process the files in?
4. How do you discover the test runner?

Return JSON:
{
  "mode": "string",
  "phase_0_output": "string describing the ranked file list you would present",
  "processing_order": ["file1", "file2"],
  "runner_discovery": "string describing discovery steps",
  "notes": "string"
}
```

Expected: mode = "Post-feature", phase_0_output shows ranked list, runner_discovery describes checking repo-map.json first.

- [ ] **Step 3: If subagent fails either check, identify the gap and fix SKILL.md**

Return to Task 2 and add explicit language addressing the failure. Re-run Step 1 and 2 until both pass. This is the REFACTOR loop of writing-skills.

- [ ] **Step 4: Commit verification record**

```bash
git add -A
git commit -m "docs: record write-tests skill GREEN verification (writing-skills)"
```

---

## Task 4: Eval fixture — eval-1 (order-service, over-mocked)

**Files:**
- Create: `skills/write-tests/evals/fixtures/eval-1-audit-over-mocked/src/order-service.ts`
- Create: `skills/write-tests/evals/fixtures/eval-1-audit-over-mocked/src/__tests__/order-service.test.ts`

- [ ] **Step 1: Create order-service.ts**

```typescript
// skills/write-tests/evals/fixtures/eval-1-audit-over-mocked/src/order-service.ts

export interface Order {
  id: string;
  userId: string;
  items: { productId: string; quantity: number; price: number }[];
  status: 'pending' | 'confirmed' | 'cancelled';
  total: number;
}

export interface Database {
  prepare: (sql: string) => { run: (...args: unknown[]) => void; get: (...args: unknown[]) => unknown };
}

export interface EventBus {
  emit: (event: string, payload: unknown) => void;
}

export class OrderService {
  constructor(
    private readonly db: Database,
    private readonly eventBus: EventBus,
  ) {}

  createOrder(userId: string, items: Order['items']): Order {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order: Order = {
      id: `ord_${Date.now()}`,
      userId,
      items,
      status: 'pending',
      total,
    };

    this.db.prepare('INSERT INTO orders VALUES (?, ?, ?, ?)').run(
      order.id,
      order.userId,
      JSON.stringify(order.items),
      order.status,
    );

    this.eventBus.emit('order.created', { orderId: order.id, userId, total });
    return order;
  }

  cancelOrder(orderId: string): void {
    const row = this.db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as Order | undefined;
    if (!row) throw new Error(`Order ${orderId} not found`);

    this.db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('cancelled', orderId);
    this.eventBus.emit('order.cancelled', { orderId });
  }
}
```

- [ ] **Step 2: Create over-mocked order-service.test.ts**

This file intentionally violates Khorikov's standards (mocks managed deps, asserts on internal calls) so the agent must catch it in Step 2 of the skill workflow.

```typescript
// skills/write-tests/evals/fixtures/eval-1-audit-over-mocked/src/__tests__/order-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderService } from '../order-service';

// ❌ Mocking managed dependency (own database — should use in-memory SQLite)
const mockDb = {
  prepare: vi.fn().mockReturnValue({
    run: vi.fn(),
    get: vi.fn(),
  }),
};

// ❌ Mocking managed dependency (own event bus)
const mockEventBus = {
  emit: vi.fn(),
};

describe('OrderService', () => {
  let service: OrderService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new OrderService(mockDb as any, mockEventBus);
  });

  it('creates an order', () => {
    const items = [{ productId: 'p1', quantity: 2, price: 50 }];
    service.createOrder('user1', items);

    // ❌ Asserting on internal implementation details
    expect(mockDb.prepare).toHaveBeenCalledWith('INSERT INTO orders VALUES (?, ?, ?, ?)');
    expect(mockDb.prepare().run).toHaveBeenCalled();
    // ❌ Asserting on managed event bus call
    expect(mockEventBus.emit).toHaveBeenCalledWith('order.created', expect.objectContaining({ userId: 'user1' }));
  });

  it('cancels an order', () => {
    mockDb.prepare().get.mockReturnValue({ id: 'ord_1', userId: 'user1', status: 'pending' });
    service.cancelOrder('ord_1');

    // ❌ Asserting on internal SQL call
    expect(mockDb.prepare).toHaveBeenCalledWith('UPDATE orders SET status = ? WHERE id = ?');
    expect(mockDb.prepare().run).toHaveBeenCalledWith('cancelled', 'ord_1');
  });
});
```

- [ ] **Step 3: Commit**

```bash
git add skills/write-tests/evals/fixtures/eval-1-audit-over-mocked/
git commit -m "test(write-tests): add eval-1 fixture — order-service over-mocked"
```

---

## Task 5: Eval fixture — eval-2 (use-poll-status, stateful hook)

**Files:**
- Create: `skills/write-tests/evals/fixtures/eval-2-stateful-hook/src/use-poll-status.ts`

- [ ] **Step 1: Create use-poll-status.ts**

```typescript
// skills/write-tests/evals/fixtures/eval-2-stateful-hook/src/use-poll-status.ts
import { useEffect, useRef, useState } from 'react';

export interface PollStatusResult {
  status: string | null;
  error: string | null;
  isLoading: boolean;
}

export function usePollStatus(url: string, intervalMs: number): PollStatusResult {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setStatus(data.status);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setIsLoading(false);
        }
      }
    };

    poll();
    intervalRef.current = setInterval(poll, intervalMs);

    return () => {
      cancelled = true;
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [url, intervalMs]);

  return { status, error, isLoading };
}
```

- [ ] **Step 2: Commit**

```bash
git add skills/write-tests/evals/fixtures/eval-2-stateful-hook/
git commit -m "test(write-tests): add eval-2 fixture — usePollStatus stateful hook"
```

---

## Task 6: Eval fixture — eval-3 (calculate-discount, latent bug)

**Files:**
- Create: `skills/write-tests/evals/fixtures/eval-3-domain-with-bug/src/calculate-discount.ts`

- [ ] **Step 1: Create calculate-discount.ts with latent bug**

The bug: gold tier applies 15% discount but never enforces the $500 cap. The function returns the wrong value when `subtotal * 0.15 > 500`.

```typescript
// skills/write-tests/evals/fixtures/eval-3-domain-with-bug/src/calculate-discount.ts

export type Tier = 'silver' | 'gold';

export interface DiscountInput {
  tier: Tier;
  subtotal: number;
}

export interface DiscountResult {
  discount: number;
  total: number;
}

/**
 * Calculates order discount.
 * Silver: 10% discount, no cap.
 * Gold: 15% discount, capped at $500 maximum discount.
 */
export function calculateDiscount({ tier, subtotal }: DiscountInput): DiscountResult {
  if (tier === 'silver') {
    const discount = subtotal * 0.1;
    return { discount, total: subtotal - discount };
  }

  // ❌ BUG: cap is never enforced — should be Math.min(subtotal * 0.15, 500)
  const discount = subtotal * 0.15;
  return { discount, total: subtotal - discount };
}
```

- [ ] **Step 2: Commit**

```bash
git add skills/write-tests/evals/fixtures/eval-3-domain-with-bug/
git commit -m "test(write-tests): add eval-3 fixture — calculateDiscount with latent cap bug"
```

---

## Task 7: Standalone eval package (promptfoo)

**Files:**
- Create: `tests/evals/prompts/skill-write-tests-audit.txt`
- Create: `tests/evals/prompts/skill-write-tests-lifecycle.txt`
- Create: `tests/evals/prompts/skill-write-tests-bug.txt`
- Create: `tests/evals/assertions/check-write-tests-contract.js`
- Create: `tests/evals/packages/write-tests/skill-write-tests.yaml`

- [ ] **Step 1: Create skill-write-tests-audit.txt**

```text
You are reviewing tests for a TypeScript service.

Read the skill at `skills/write-tests/SKILL.md`.

The source file is at `skills/write-tests/evals/fixtures/eval-1-audit-over-mocked/src/order-service.ts`.
An existing test file is at `skills/write-tests/evals/fixtures/eval-1-audit-over-mocked/src/__tests__/order-service.test.ts`.

Apply the write-tests skill workflow to this file.

Do not actually run tests or edit files. Return JSON only:

{
  "posts_todo_checklist": true/false,
  "audits_existing_tests_before_proposing_new": true/false,
  "identifies_managed_dep_mock": true/false,
  "managed_dep_description": "string — describe which dependency and why it is managed",
  "identifies_impl_detail_assertions": true/false,
  "impl_detail_description": "string — which assertions and why they are brittle",
  "leads_with_recommendation": true/false,
  "recommendation_text": "string — the actual recommendation given",
  "flags_filename_for_rename": true/false,
  "rename_suggestion": "string — suggested filename",
  "notes": "string"
}
```

- [ ] **Step 2: Create skill-write-tests-lifecycle.txt**

```text
You are writing tests for a React hook.

Read the skill at `skills/write-tests/SKILL.md`.

The source file is at `skills/write-tests/evals/fixtures/eval-2-stateful-hook/src/use-poll-status.ts`.
No existing test file exists.

Apply the write-tests skill workflow to this file.

Do not actually run tests or create files. Return JSON only:

{
  "posts_todo_checklist": true/false,
  "classifies_as_controller": true/false,
  "classification_reason": "string",
  "surfaces_unmount_cleanup_scenario": true/false,
  "lifecycle_scenario_description": "string",
  "leads_with_recommendation": true/false,
  "mocks_only_unmanaged_deps": true/false,
  "unmanaged_deps_identified": ["string"],
  "uses_renderhook_unmount": true/false,
  "test_filename": "string — what filename the test would be given",
  "notes": "string"
}
```

- [ ] **Step 3: Create skill-write-tests-bug.txt**

```text
You are writing tests for a pure TypeScript function.

Read the skill at `skills/write-tests/SKILL.md`.

The source file is at `skills/write-tests/evals/fixtures/eval-3-domain-with-bug/src/calculate-discount.ts`.
No existing test file exists.

Apply the write-tests skill workflow to this file.

Do not actually run tests or create files. Return JSON only:

{
  "posts_todo_checklist": true/false,
  "classifies_as_domain": true/false,
  "classification_reason": "string",
  "no_mocks_in_unit_test": true/false,
  "uses_output_based_assertions": true/false,
  "proposes_gold_cap_scenario": true/false,
  "gold_cap_scenario_description": "string",
  "asserts_desired_not_actual_behaviour": true/false,
  "desired_assertion_description": "string — what the test would assert for gold tier > $500",
  "reports_red_test_as_bug": true/false,
  "leads_with_recommendation": true/false,
  "notes": "string"
}
```

- [ ] **Step 4: Create check-write-tests-contract.js**

```javascript
// tests/evals/assertions/check-write-tests-contract.js
const { extractJsonObject } = require('./schema-helpers');

function parseExpectedBoolean(value) {
  if (value === undefined) return null;
  return String(value).trim().toLowerCase() === 'true';
}

module.exports = (output, context) => {
  let payload;
  try {
    payload = extractJsonObject(output);
  } catch (error) {
    return { pass: false, score: 0, reason: `Failed to parse JSON output: ${error.message}` };
  }

  const checks = [
    ['posts_todo_checklist', parseExpectedBoolean(context.vars.expect_posts_todo_checklist)],
    ['audits_existing_tests_before_proposing_new', parseExpectedBoolean(context.vars.expect_audits_existing_tests)],
    ['identifies_managed_dep_mock', parseExpectedBoolean(context.vars.expect_identifies_managed_dep_mock)],
    ['identifies_impl_detail_assertions', parseExpectedBoolean(context.vars.expect_identifies_impl_detail_assertions)],
    ['leads_with_recommendation', parseExpectedBoolean(context.vars.expect_leads_with_recommendation)],
    ['flags_filename_for_rename', parseExpectedBoolean(context.vars.expect_flags_filename_for_rename)],
    ['classifies_as_controller', parseExpectedBoolean(context.vars.expect_classifies_as_controller)],
    ['surfaces_unmount_cleanup_scenario', parseExpectedBoolean(context.vars.expect_surfaces_unmount_cleanup)],
    ['mocks_only_unmanaged_deps', parseExpectedBoolean(context.vars.expect_mocks_only_unmanaged_deps)],
    ['uses_renderhook_unmount', parseExpectedBoolean(context.vars.expect_uses_renderhook_unmount)],
    ['classifies_as_domain', parseExpectedBoolean(context.vars.expect_classifies_as_domain)],
    ['no_mocks_in_unit_test', parseExpectedBoolean(context.vars.expect_no_mocks_in_unit_test)],
    ['uses_output_based_assertions', parseExpectedBoolean(context.vars.expect_uses_output_based_assertions)],
    ['proposes_gold_cap_scenario', parseExpectedBoolean(context.vars.expect_proposes_gold_cap_scenario)],
    ['asserts_desired_not_actual_behaviour', parseExpectedBoolean(context.vars.expect_asserts_desired_behaviour)],
    ['reports_red_test_as_bug', parseExpectedBoolean(context.vars.expect_reports_red_test_as_bug)],
  ];

  const failures = [];
  for (const [field, expected] of checks) {
    if (expected === null) continue;
    const actual = payload[field];
    if (actual !== expected) {
      failures.push(`${field}: expected ${expected}, got ${actual}`);
    }
  }

  if (failures.length > 0) {
    return { pass: false, score: 0, reason: `Contract failures:\n${failures.join('\n')}` };
  }
  return { pass: true, score: 1, reason: 'All contract checks passed' };
};
```

- [ ] **Step 5: Create skill-write-tests.yaml**

```yaml
# yaml-language-server: $schema=https://promptfoo.dev/config-schema.json
description: "write-tests skill — Khorikov audit, lifecycle classification, domain bug detection"

providers:
  - id: anthropic:claude-agent-sdk
    config:
      model: claude-haiku-4-5-20251001
      working_dir: ../..
      max_turns: 8
      permission_mode: auto
      append_allowed_tools:
        - Read

defaultTest:
  assert:
    - type: javascript
      value: file://../../assertions/check-write-tests-contract.js

tests:
  - description: "audit — identifies over-mocked integration test and recommends rewrite"
    prompts:
      - id: audit
        label: write-tests-audit
        raw: file://../../prompts/skill-write-tests-audit.txt
    vars:
      expect_posts_todo_checklist: "true"
      expect_audits_existing_tests: "true"
      expect_identifies_managed_dep_mock: "true"
      expect_identifies_impl_detail_assertions: "true"
      expect_leads_with_recommendation: "true"
      expect_flags_filename_for_rename: "true"

  - description: "lifecycle — classifies controller hook, surfaces unmount scenario"
    prompts:
      - id: lifecycle
        label: write-tests-lifecycle
        raw: file://../../prompts/skill-write-tests-lifecycle.txt
    vars:
      expect_posts_todo_checklist: "true"
      expect_classifies_as_controller: "true"
      expect_surfaces_unmount_cleanup: "true"
      expect_leads_with_recommendation: "true"
      expect_mocks_only_unmanaged_deps: "true"
      expect_uses_renderhook_unmount: "true"

  - description: "domain bug — finds latent cap bug, leaves test red, reports"
    prompts:
      - id: bug
        label: write-tests-bug
        raw: file://../../prompts/skill-write-tests-bug.txt
    vars:
      expect_posts_todo_checklist: "true"
      expect_classifies_as_domain: "true"
      expect_no_mocks_in_unit_test: "true"
      expect_uses_output_based_assertions: "true"
      expect_proposes_gold_cap_scenario: "true"
      expect_asserts_desired_behaviour: "true"
      expect_reports_red_test_as_bug: "true"
      expect_leads_with_recommendation: "true"
```

- [ ] **Step 6: Commit**

```bash
git add tests/evals/prompts/skill-write-tests-audit.txt \
        tests/evals/prompts/skill-write-tests-lifecycle.txt \
        tests/evals/prompts/skill-write-tests-bug.txt \
        tests/evals/assertions/check-write-tests-contract.js \
        tests/evals/packages/write-tests/skill-write-tests.yaml
git commit -m "feat(evals): add write-tests standalone eval package (3 scenarios)"
```

---

## Task 8: Co-trigger eval package

**Files:**
- Create: `tests/evals/prompts/skill-write-tests-co-trigger.txt`
- Create: `tests/evals/assertions/check-write-tests-co-trigger.js`
- Create: `tests/evals/packages/write-tests-co-trigger/skill-write-tests-co-trigger.yaml`

- [ ] **Step 1: Create skill-write-tests-co-trigger.txt**

```text
You are about to implement a feature.

Read the skill at `skills/implementing-linear-issue/SKILL.md`.
Read the skill at `skills/write-tests/SKILL.md`.

Scenario: {{scenario_description}}

Based on both skills, answer these questions about what you would do:

1. Does implementing-linear-issue require branch and worktree setup?
2. Does write-tests require you to discover which files need tests before starting?
3. What mode does write-tests detect for this scenario?
4. What is the first thing you do for tests (Phase 0)?

Do not actually call tools. Return JSON only:

{
  "reads_implementing_linear_issue_skill": true,
  "reads_write_tests_skill": true,
  "proposes_branch_and_worktree": true/false,
  "runs_phase_0_discovery": true/false,
  "detected_mode": "string",
  "phase_0_first_step": "string — exact first discovery step",
  "proposes_behaviour_list_or_tdd": true/false,
  "notes": "string"
}
```

- [ ] **Step 2: Create check-write-tests-co-trigger.js**

```javascript
// tests/evals/assertions/check-write-tests-co-trigger.js
const { extractJsonObject } = require('./schema-helpers');

function parseExpectedBoolean(value) {
  if (value === undefined) return null;
  return String(value).trim().toLowerCase() === 'true';
}

module.exports = (output, context) => {
  let payload;
  try {
    payload = extractJsonObject(output);
  } catch (error) {
    return { pass: false, score: 0, reason: `Failed to parse JSON output: ${error.message}` };
  }

  const checks = [
    ['reads_implementing_linear_issue_skill', parseExpectedBoolean(context.vars.expect_reads_implementing_skill)],
    ['reads_write_tests_skill', parseExpectedBoolean(context.vars.expect_reads_write_tests_skill)],
    ['proposes_branch_and_worktree', parseExpectedBoolean(context.vars.expect_proposes_branch_and_worktree)],
    ['runs_phase_0_discovery', parseExpectedBoolean(context.vars.expect_runs_phase_0_discovery)],
    ['proposes_behaviour_list_or_tdd', parseExpectedBoolean(context.vars.expect_proposes_behaviour_list_or_tdd)],
  ];

  const failures = [];
  for (const [field, expected] of checks) {
    if (expected === null) continue;
    const actual = payload[field];
    if (actual !== expected) {
      failures.push(`${field}: expected ${expected}, got ${actual}`);
    }
  }

  if (failures.length > 0) {
    return { pass: false, score: 0, reason: `Co-trigger failures:\n${failures.join('\n')}` };
  }
  return { pass: true, score: 1, reason: 'Co-trigger checks passed' };
};
```

- [ ] **Step 3: Create skill-write-tests-co-trigger.yaml**

```yaml
# yaml-language-server: $schema=https://promptfoo.dev/config-schema.json
description: "write-tests + implementing-linear-issue co-trigger — both skills fire for any implementation prompt"

prompts:
  - id: co-trigger
    label: write-tests-co-trigger
    raw: file://../../prompts/skill-write-tests-co-trigger.txt

providers:
  - id: anthropic:claude-agent-sdk
    config:
      model: claude-haiku-4-5-20251001
      working_dir: ../..
      max_turns: 10
      permission_mode: auto
      append_allowed_tools:
        - Read

defaultTest:
  assert:
    - type: javascript
      value: file://../../assertions/check-write-tests-co-trigger.js

tests:
  - description: "co-trigger — Linear issue prompt fires both skills"
    vars:
      scenario_description: "Implement Linear issue ENG-1023 — add rate limiting to the public API endpoints."
      expect_reads_implementing_skill: "true"
      expect_reads_write_tests_skill: "true"
      expect_proposes_branch_and_worktree: "true"
      expect_runs_phase_0_discovery: "true"
      expect_proposes_behaviour_list_or_tdd: "true"

  - description: "co-trigger — generic feature prompt fires both skills without Linear context"
    vars:
      scenario_description: "Add input validation to the user signup endpoint — reject missing email and passwords under 8 characters."
      expect_reads_implementing_skill: "true"
      expect_reads_write_tests_skill: "true"
      expect_proposes_branch_and_worktree: "false"
      expect_runs_phase_0_discovery: "true"
      expect_proposes_behaviour_list_or_tdd: "true"
```

- [ ] **Step 4: Commit**

```bash
git add tests/evals/prompts/skill-write-tests-co-trigger.txt \
        tests/evals/assertions/check-write-tests-co-trigger.js \
        tests/evals/packages/write-tests-co-trigger/skill-write-tests-co-trigger.yaml
git commit -m "feat(evals): add write-tests co-trigger eval package (Linear + generic prompts)"
```

---

## Task 9: Coverage baseline update + final verification

**Files:**
- Modify: `tests/evals/skill-eval-coverage-baseline.json`
- Modify: `repo-map.json`

- [ ] **Step 1: Remove write-tests from uncovered baseline**

In `tests/evals/skill-eval-coverage-baseline.json`, remove `"write-tests"` from the array. Result:

```json
{
  "uncovered_skills": [
    "adversarial-review",
    "agent-browser",
    "explaining-code",
    "playwright",
    "shadcn-ui"
  ]
}
```

- [ ] **Step 2: Update repo-map.json eval_harness description**

In `repo-map.json`, update the `eval_harness` description to mention write-tests:

```json
"eval_harness": {
  "path": "tests/evals/",
  "description": "Promptfoo harness and deterministic compatibility checks for skills in this repository. Current packages cover the Linear workflow skills, create-feature-request, maintain-github-repos, write-tests (standalone + co-trigger), bundled raising-linear-pr promptfoo DB gate helper tests, eval coverage reporting, and Codex compatibility."
}
```

- [ ] **Step 3: Run eval:coverage and confirm it passes**

```bash
cd /Users/arpit/Code/AccelerateDataAI/worktrees/feature/write-tests-skill-building
npm run eval:coverage
```

Expected output:
```
Skill eval coverage: 8/12 skills have eval packages.
Uncovered skills:
- adversarial-review
- agent-browser
- explaining-code
- playwright
- shadcn-ui
```

Exit code must be 0. If non-zero, check that both `write-tests` and `write-tests-co-trigger` directories exist under `tests/evals/packages/`.

- [ ] **Step 4: Run eval:codex-compatibility and confirm it passes**

```bash
npm run eval:codex-compatibility
```

Expected: `Codex compatibility check passed for N files.` Exit code 0.

- [ ] **Step 5: Final commit**

```bash
git add tests/evals/skill-eval-coverage-baseline.json repo-map.json
git commit -m "chore: update coverage baseline and repo-map for write-tests evals"
```

- [ ] **Step 6: Verify full git log on branch**

```bash
git log --oneline feature/write-tests-skill-building ^main
```

Expected commits (in order, newest first):
```
chore: update coverage baseline and repo-map for write-tests evals
feat(evals): add write-tests co-trigger eval package
feat(evals): add write-tests standalone eval package (3 scenarios)
test(write-tests): add eval-3 fixture — calculateDiscount with latent cap bug
test(write-tests): add eval-2 fixture — usePollStatus stateful hook
test(write-tests): add eval-1 fixture — order-service over-mocked
docs: record write-tests skill GREEN verification
feat(write-tests): rewrite skill — mode detection, discovery, framework-agnostic
docs: record write-tests skill baseline failures (writing-skills RED)
Add write-tests skill (initial drop + AGENTS.md + coverage baseline)
Add write-tests skill design spec
```

---

## Self-Review

**Spec coverage check:**
- ✅ Description rewrite → Task 2 Step 1
- ✅ Mode detection → Task 2 Step 3
- ✅ Phase 0 discovery → Task 2 Step 4
- ✅ Mode workflows (all 5) → Task 2 Step 5
- ✅ Cross-skill handoffs → Task 2 Step 6
- ✅ Framework detection → Task 2 Step 7
- ✅ Agent Workflow Rule (separate session) → Task 2 Step 8
- ✅ Classical school mocking note → Task 2 Step 9
- ✅ testing-standards.md reference → Task 2 Step 10
- ✅ Eval fixture eval-1 → Task 4
- ✅ Eval fixture eval-2 → Task 5
- ✅ Eval fixture eval-3 → Task 6
- ✅ Standalone promptfoo package → Task 7
- ✅ Co-trigger promptfoo package → Task 8
- ✅ Coverage baseline removal → Task 9
- ✅ writing-skills RED baseline → Task 1
- ✅ writing-skills GREEN verification → Task 3

**Placeholder scan:** No TBDs, all code blocks complete, all commands have expected output.

**Type consistency:** `extractJsonObject` used consistently across both assertion files — imported from `./schema-helpers` matching the existing pattern in `check-linear-skill-contract.js`. Fixture TypeScript types are self-contained per file.
