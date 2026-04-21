*Date: 2026-04-15*

# Testing Standards — FE/BE (Deterministic Code)

## Why This Exists

AI agents write code and tests fast. But an agent that builds a feature will write tests to make itself look good — tests that pass but prove nothing. Without standards, coverage goes up but confidence doesn't.

These standards apply to all deterministic code: React components, Express routes, Zustand stores, services, utilities. They do NOT apply to agent/skill eval testing (that's Promptfoo — separate framework).

---

## The Formula: What Makes a Test Good or Bad

Every test result falls into one of 4 outcomes. Two are good. Two are dangerous. The entire testing standards exist to maximize the good and eliminate the dangerous.

|  | Code is broken | Code is working |
|---|---|---|
| **Test fails** | ✅ **True Positive** — test caught a real bug. This is why tests exist. | ❌ **False Positive** — test broke but code is fine. Noise. Wastes time. Erodes trust. |
| **Test passes** | ❌ **False Negative** — test passed but code is broken. Silent bug in production. Most dangerous outcome. | ✅ **True Negative** — test passed and code works. Correct green. |

![Testing outcomes](https://miro.medium.com/v2/resize:fit:960/format:webp/0*OuIXOuKnc-tk3g37)

**The goal of every test:** maximize True Positives and True Negatives. Eliminate the other two.

**Why this matters for AI-written tests:**
- AI agents produce **false negatives** easily — tests that pass by asserting on their own mocks, not on real behaviour. Coverage looks green, production breaks.
- AI agents produce **false positives** when they couple tests to implementation details — every refactor breaks tests even though the feature works fine. Teams start ignoring test failures.

**This connects directly to Khorikov's 4 pillars:**

| Pillar | What it eliminates |
|---|---|
| **Pillar 1: Protection against regressions** | Eliminates **false negatives** — tests that pass when code is broken |
| **Pillar 2: Resistance to refactoring** | Eliminates **false positives** — tests that fail when code is fine |
| **Pillar 3: Fast feedback** | Makes True Positives useful — a bug caught in 3 seconds is actionable, a bug caught after 10 minutes is too late |
| **Pillar 4: Maintainability** | Keeps the whole system working — unmaintainable tests get deleted, leaving you with no protection at all |

**The tradeoff:** You can't maximize all 4 pillars simultaneously. More regression protection = more code tested together = slower. The balance: unit tests (fast, less protection) for edge cases, integration tests (slower, more protection) for happy paths.

**The non-negotiable:** If you must sacrifice a pillar, **never sacrifice Pillar 2 (resistance to refactoring)**. Brittle tests that break on every refactor destroy trust in the entire suite. Teams start ignoring failures, and then true positives get lost in the noise. Pillar 2 is what keeps the suite alive long-term.

---

## Foundation: Khorikov's 4 Pillars of a Good Test

Every test in this codebase is judged against these 4 pillars. A test that fails any pillar is worse than no test — it creates false confidence or noise.

### Pillar 1: Protection Against Regressions

**What it means:** The test catches real bugs when code changes. If someone breaks the feature, this test turns red.

**How to evaluate:** Ask — "what breaks if I delete the code this test covers?" If you can't answer that, the test protects against nothing.

**What fails this pillar:**
- `expect(component).toBeInTheDocument()` with no other assertions — component could render empty and still pass
- Tests that only check "doesn't crash" without verifying actual output
- Tests that assert on mock return values you set up yourself (circular — you're testing your own mock)

**What passes this pillar:**
- `screen.getByText('Connection failed')` — verifies error message actually appears
- `expect(response.status).toBe(404)` — verifies API rejects missing resources
- `expect(store.getState().selectedId).toBeNull()` after a reset action — verifies state actually changed

**Our caveat:** AI agents generate shallow "renders without crashing" tests easily. These score 0 on this pillar. Every test must assert on a specific, meaningful outcome.

### Pillar 2: Resistance to Refactoring

**What it means:** The test doesn't break when you change HOW the code works, only when you change WHAT it does. A test that breaks on harmless refactors is a false positive — it creates noise and erodes trust.

**The core rule:** Test observable behaviour, not implementation details.

Code is **observable behaviour** when it:
- Exposes an **operation** that helps the client achieve a goal (user clicks → something visible happens)
- Exposes a **state** that helps the client achieve a goal (API returns data the frontend needs)

Everything else is an **implementation detail** — internal state, private methods, which helper function was called, how the result was computed.

| Observable (test this) | Implementation (don't test this) | Why the right column is bad |
|---|---|---|
| `screen.getByText('Error: connection failed')` | `expect(setStreamError).toHaveBeenCalledWith(...)` | Breaks if error handling is refactored but error still shows |
| `expect(response.status).toBe(404)` | `expect(findById).toHaveBeenCalled()` | Breaks if service switches from `findById` to `findOne` |
| `expect(store.getState().selectedId).toBe('x')` | `expect(set).toHaveBeenCalledWith({selectedId: 'x'})` | Tests Zustand internals, not the actual state |
| `expect(result).toEqual({ total: 100 })` | `expect(calculateSubtotal).toHaveBeenCalledTimes(3)` | Breaks if calculation logic is restructured |

**Our caveat:** This is the most important pillar for agentic development. Agents refactor code constantly. If tests are coupled to implementation, every refactor breaks tests that don't mean anything — and agents waste time "fixing" tests instead of building features.

### Pillar 3: Fast Feedback

**What it means:** Tests run fast enough that they're part of the development loop, not a ceremony you run once a day.

**The rules:**
- Unit tests: < 5 seconds per file. No network calls, no real DB, no filesystem
- Integration tests: < 30 seconds per suite. Real DB (in-memory SQLite) is fine
- If a test needs `setTimeout` or `sleep` to work, something is wrong

**Tradeoff with Pillar 1:** Unit tests are fast but test code in isolation (less regression protection). Integration tests are slower but test real interactions (more regression protection). You need both — unit tests for edge cases and fast feedback, integration tests for happy paths and confidence.

**Our caveat:** Vitest is fast. jsdom is fast. Don't sacrifice test quality for speed — but don't write tests that take 10 seconds because they hit real APIs either.

### Pillar 4: Maintainability

**What it means:** A developer (or agent) can read the test, understand what it verifies, and modify it when requirements change. Unmaintainable tests get deleted instead of fixed.

**The rules:**
- **Arrange-Act-Assert structure** — every test has 3 clear sections. If there's no "Act" (action), it's not a test.
- **One behaviour per test** — test name reads as a requirement: `shows error message when network fails`, not `test case 1`
- **Factory helpers** — `makeModel()`, `makeIntent()` with `Partial<T>` overrides. Don't inline 20-line objects in every test.
- **Minimal setup** — if a test needs 30 lines of mock configuration, the code is too coupled (see "overcomplicated code" below)

**Our caveat:** AI agents produce verbose tests with duplicated setup. The standard: every test file has factory helpers at the top, each test body is < 15 lines (excluding the factory call).

---

## Khorikov's Code Categories — What to Test How

Not all code should be tested the same way. Khorikov classifies code into 4 categories based on two axes — complexity and number of collaborators:

```
                        Has collaborators?
                       YES              NO
                ┌──────────────┬──────────────┐
  Complex       │Overcomplicated│   Domain /   │
  logic?  YES   │  REFACTOR ⚠️  │  Algorithms  │
                ├──────────────┼──────────────┤
          NO    │ Controllers  │   Trivial    │
                │              │   code       │
                └──────────────┴──────────────┘
```

| Category | How to test | Test doubles needed | Example in our codebase |
|----------|-------------|---------------------|------------------------|
| **Domain / algorithms** | Unit test thoroughly — all branches, edge cases | **None** — pure functions, no fakes needed | `parseSSEBuffer`, `buildDynamicContext`, store reducers, Zod schemas |
| **Controllers / orchestrators** | Integration test — happy path only | **Stubs** for DB, **mocks** only for important side effects (email, events) | Express route handlers, `StreamOrchestrator`, `SessionManager` |
| **Trivial** | Don't test | None | Getters, re-exports, type definitions, config constants |
| **Overcomplicated** | **Refactor first** — split into domain + controller, then test | N/A — fix the design | If a file is both logic-heavy AND heavily coupled, it's a design problem, not a testing problem |

**The practical mapping — what most test code actually looks like:**

| What you're testing | Test doubles | Why |
|---|---|---|
| Domain logic (calculations, rules, parsing) | Nothing — pure functions | No dependencies to fake |
| Service hitting the DB | Stub the DB | DB is a managed dependency — stub for unit tests, real for integration |
| Service sending email / emitting event | Mock the mailer / event bus | This IS the observable behaviour — "system sends email" is a requirement |
| Most of the codebase | Stubs or nothing | Mocks are the exception, not the default |

**Bottom line:** In this codebase, most tests should be either **pure** (no fakes at all) or **stub-based**. Mocks are used sparingly — only for truly important side effects that need to be verified as behaviour (emails sent, events emitted, external APIs called).

**Why this matters for us:** AI agents often generate "overcomplicated" code — a service that does business logic AND orchestrates 5 other services. Don't write tests for overcomplicated code. Refactor it first, then test the separated pieces.

---

## Test Doubles: Mocks vs Stubs

Most developers blur the line between mocks and stubs. Khorikov draws a sharp distinction that matters:

| Type | What it does | Direction | Example |
|---|---|---|---|
| **Stub** | Provides canned answers TO the system under test | Incoming — feeds data in | `vi.mocked(fetch).mockResolvedValue({ ok: true, json: () => ({}) })` |
| **Mock** | Verifies the system under test made the right OUTGOING calls | Outgoing — checks what went out | `expect(sendEmail).toHaveBeenCalledWith('user@test.com')` |

**The rule:** Asserting on stubs is meaningless — you're checking your own setup. Only assert on mocks when the outgoing call IS the observable behaviour (e.g., "system sends an email" is a real requirement). If the outgoing call is an internal implementation detail, don't assert on it.

**Why this matters:** AI agents love asserting on stubs. `vi.mocked(getUser).mockReturnValue(user)` then `expect(getUser).toHaveBeenCalled()` — this tests nothing. You told the mock to return data, then verified the mock was called. Circular.

---

## Mocking: When to Mock, When Not To

Over-mocking is the #1 way AI agents produce false-green tests. Mock everything → test runs in a fantasy world → passes → production breaks.

### Classical School (our approach)

There are two schools of unit testing. The **London school** mocks every collaborator — isolating each class. The **Classical school** tests units of **behaviour** (which may involve multiple classes) and only mocks at the system boundary.

We follow the Classical school. Why: the London school produces tests tightly coupled to the dependency graph. Rename a helper, move a function, extract a module — all tests break even though behaviour is unchanged. That's a false positive factory, which violates Pillar 2.

Classical tests are resilient because they test outcomes, not interaction patterns.

### Dependency Types

Khorikov classifies dependencies into types, and each type has a clear mocking rule:

| Dependency type | Description | Mock it? | Example in our codebase |
|---|---|---|---|
| **Unmanaged, out-of-process** | External API you don't control | ✅ Yes — always mock | Anthropic API, GitHub API, Fabric SQL endpoint |
| **Managed, out-of-process** | Your own database | ❌ No — use real instance | SQLite via better-sqlite3 |
| **In-process** | Your own modules calling each other | ❌ Never mock | `chatService` calling `intentService` |
| **Browser APIs** | DOM, fetch, timers | ✅ Yes — in unit tests | `vi.stubGlobal('fetch')`, `vi.useFakeTimers()` |

**The principle:** If you mock the thing you're testing, you're testing the mock. Only mock boundaries you don't own.

**On database mocking:** Khorikov specifically argues against in-memory fakes for databases. In-memory DBs diverge from real DB behaviour in subtle ways — transaction semantics, constraint enforcement, query edge cases. Tests pass locally, break in production. For integration tests, use the real database. For unit tests, don't involve the DB at all — test the domain logic that doesn't need a DB.

**Our caveat — module boundary mocking:** Some React components import stores and services deeply. When mocking is unavoidable (e.g., `useChatStore` in a component test), mock at the **module boundary** (`vi.mock('@/store')`) not at individual function level. Return the minimal shape, not fake behaviour.

---

## Integration Testing Rules

Unit tests cover edge cases. Integration tests cover happy paths. Don't duplicate.

| Rule | Why |
|---|---|
| Integration tests = happy path only | Edge cases are cheaper to test in unit tests |
| Use real managed dependencies (DB) | Mocking the DB means you're not testing the actual query |
| Mock only unmanaged dependencies (external APIs) | External calls are slow, flaky, cost money |
| Max 3 layers of indirection | domain → application services → infrastructure. More layers = harder to test = design smell |

---

## Test Organisation: Per-Behaviour, Not Per-Method

Don't organise tests by which method they call. Organise by what behaviour they verify.

**Bad:**
```
describe('calculateTotal')
  it('test calculateTotal')
  it('test calculateTotal with discount')
```

**Good:**
```
describe('order pricing')
  it('applies percentage discount to subtotal')
  it('returns zero when cart is empty')
  it('caps discount at order total — never goes negative')
```

Why: per-method tests couple to the API surface. When you rename or split a method, all tests break (false positive). Per-behaviour tests survive refactors because the behaviour stays the same even if the method signature changes.

---

## The Value Proposition: When to Delete Tests

Every test has a cost (writing, maintenance, CI time, cognitive load) and a benefit (regression protection, documentation). A test is only worth keeping if the benefit exceeds the cost.

**The practical implication:** Actively delete tests that have low value, even if coverage drops. A smaller suite of high-signal tests beats a large suite padded with shallow ones.

**When to delete a test:**
- It asserts on implementation details and breaks on every refactor (high cost, low benefit)
- It duplicates another test at a different level (unit + integration testing the same happy path)
- It tests trivial code (getters, one-line pass-throughs) — maintenance cost with zero bug-catching value
- It was written just to hit a coverage number

**For our codebase:** When fixing the 22 FE and 82 BE pre-existing failures, don't automatically fix every test. Ask first: "is this test worth keeping?" If not, delete it. Fewer, better tests > more, worse tests.

---

## Anti-Patterns — Tests That Look Good But Aren't

| Anti-pattern | Why it's bad | What to do instead |
|---|---|---|
| Testing private methods | They're private for a reason — test the public API that uses them | Test the public function that calls the private one |
| Over-mocking (mocking your own modules) | You're testing the mock, not the code | Use real implementations; only mock external deps |
| "Renders without crashing" as only assertion | Proves nothing — component could render empty | Assert on specific visible output |
| Test setup longer than the test itself | Unmaintainable; probably testing overcomplicated code | Refactor the code, use factories |
| Testing same thing in unit AND integration tests | Duplication — when code changes, two tests break | Unit = edge cases, integration = happy path. Don't overlap. |
| Test-per-method organisation | Couples to API surface, breaks on rename | Organise by behaviour/scenario instead |
| Tests created just to hit coverage numbers | Produces meaningless assertions on implementation details | Only write tests that catch real bugs |
| Asserting on stubs you set up | Circular — testing your own mock setup | Assert on observable output, not mock inputs |
| Agent writes its own tests | Self-attestation — agent confirms its own work | Separate sessions: feature agent ≠ test agent |

---

## Agent Workflow Rule

**The agent that builds the feature must NOT write its tests.**

AI agents self-attest. The agent that wrote the code knows what the code does and writes tests that confirm it — including bugs. It cannot see its own mistakes because it has the same context.

**How to enforce:**
- Feature work and test work run in **separate sessions** with separate context
- The test session receives the **requirement** (what the code should do) — not the implementation
- The test session reads the code fresh, like a reviewer would

This aligns with the industry Planner-Generator-Evaluator pattern: the evaluator must not share context with the generator.

---

## What This Doc Does NOT Cover

| Topic | Covered by |
|---|---|
| Non-deterministic testing (agents, skills) | Promptfoo eval framework |
| E2E testing (Playwright) | Separate doc |
| CI enforcement (removing `continue-on-error`) | Separate ops ticket |
| Specific test cases and fixtures per component | Step 3 of the ladder — built on top of this |
| Execution approach (Vitest config, RTL setup) | Step 4 of the ladder |

---

## References

- Vladimir Khorikov — [Unit Testing: Principles, Practices, and Patterns](https://www.manning.com/books/unit-testing) (Manning, 2020) — foundation for the 4 pillars, code categories, mocking rules. [PDF](https://books-library.website/files/books-library.net-07192142Kn9I3.pdf) | [Infographic](https://khorikov.org/files/infographic.pdf)
- Vladimir Khorikov — [Don't mock your database, it's an implementation detail](https://vkhorikov.medium.com/dont-mock-your-database-it-s-an-implementation-detail-8f1b527c78be)
- Kent C. Dodds — [The Testing Trophy and Testing Classifications](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications) — "test behaviour, not implementation"
- Kent C. Dodds — [Write tests. Not too many. Mostly integration.](https://kentcdodds.com/blog/write-tests)
- [Planner, Generator, Evaluator: Multi-Agent QA Architecture](https://www.shiplight.ai/blog/planner-generator-evaluator-multi-agent-qa) — generator ≠ evaluator
- [Frontend Testing in 2026: What to Test, What to Skip, and Why Most Tests Lie](https://www.atinatechnology.in/frontend-testing-in-2026)
- [15 Unit Testing Best Practices — Quality Over Quantity](https://www.augmentcode.com/guides/unit-testing-best-practices-that-focus-on-quality-over-quantity)
- [UI Testing Best Practices](https://github.com/NoriSte/ui-testing-best-practices) — community-maintained, updated March 2025

---

this should be good line to remember how testing should (now just for me): your test strategy needs to match the nature of what you're testing