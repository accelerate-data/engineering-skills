# Code Classification — Khorikov's Quadrant

Two axes: **domain significance** (does the code enforce business rules?) and **collaborators** (how many external modules does it call?).

```text
                     Collaborators?
                    Few            Many
                 ┌──────────────┬──────────────────┐
  Domain         │   DOMAIN     │  OVERCOMPLICATED │
  significance   │              │                  │
        High     │   Unit test  │  Refactor first  │
                 │   all branches│  (Humble Object) │
                 ├──────────────┼──────────────────┤
        Low      │   TRIVIAL    │   CONTROLLER     │
                 │              │                  │
                 │   Skip       │ Flow / e2e layer │
                 │              │    (not here)    │
                 └──────────────┴──────────────────┘
```

| Category | Test type | Test doubles |
|---|---|---|
| **Domain** | Unit — all branches, edge cases | None (pure functions) |
| **Controller** | Not authored here — its cross-module behaviour is covered by the repo's flow / e2e layer (happy path). Unit-test any pure logic you extract. | — |
| **Trivial** | Skip | — |
| **Overcomplicated** | **Refactor first** via Humble Object | — |
| **LLM-boundary** (codebase extension) | Unit test deterministic part | Mock the API |

**Domain significance ≠ complex code.** A 3-line function enforcing `endDate >= startDate` is domain code.

**Test-value ranking (this skill):** Domain first. A Controller's behaviour is covered by the repo's flow / e2e layer, not by this skill; Trivial is skipped.

## Domain signals — these are domain code even when short

- Business rules (`if user.tier === 'free' && count > 10 → reject`)
- Format parsing/serialization (SSE, CSV, JSON protocol, URL builders)
- Validation / invariants
- State machines / status transitions
- Calculations (pricing, taxes, rankings, similarity)
- Error classification (mapping error shapes to domain types)

## Collaborators — what counts as "many"

**Count:** database/ORM calls, HTTP fetches, store reads/writes, filesystem I/O, other service imports.

**Don't count:** logger/metrics (infrastructure), pure utilities (lodash, date-fns, Zod schemas).

## Humble Object pattern — the canonical refactor

When code is overcomplicated, don't "test as-is":

1. **Extract** the domain logic into a pure function → becomes Domain (unit-testable, all branches)
2. **Leave behind** the thin orchestrator → becomes Controller, whose cross-module behaviour is covered by the repo's flow / e2e layer (happy path) — not an integration test authored here
3. **Test both normally**

When proposing refactor, name the pattern and point at the specific function to extract. Never just say "split it up".

## Edge cases — common classifications

- **Zustand store file** = domain (state transitions). Hooks consuming it + driving UI = controller.
- **Zod schema** = domain. Test with `safeParse(valid)` and `safeParse(invalid)`.
- **Pure React component** (no state, no effects, no store reads) = trivial. Skip.
- **Effectful hooks** (`useChatScroll`, `useIntentManager`) = controller. Component-test the UI behaviour they drive (jsdom, real store, mock infra); leave cross-module orchestration to the flow / e2e layer.
- **Express middleware** = controller. Its real request-lifecycle behaviour belongs to the repo's flow / e2e layer; unit-test any pure logic you extract from it.
