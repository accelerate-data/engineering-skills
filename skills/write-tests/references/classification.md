# Code Classification — Khorikov's Quadrant

Two axes: **domain significance** (does the code enforce business rules?) and **collaborators** (how many external modules does it call?).

```
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
                 │   Skip       │ Integration test │
                 │              │   (happy path)   │
                 └──────────────┴──────────────────┘
```

| Category | Test type | Test doubles |
|---|---|---|
| **Domain** | Unit — all branches, edge cases | None (pure functions) |
| **Controller** | Integration — happy path only | Mocks for unmanaged deps, real managed deps |
| **Trivial** | Skip | — |
| **Overcomplicated** | **Refactor first** via Humble Object | — |
| **LLM-boundary** (codebase extension) | Unit test deterministic part | Mock the API |

**Domain significance ≠ complex code.** A 3-line function enforcing `endDate >= startDate` is domain code.

**Test-value ranking:** Domain > Controller > Trivial. Spend tokens on Domain first.

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
2. **Leave behind** the thin orchestrator → becomes Controller (integration-testable, happy path)
3. **Test both normally**

When proposing refactor, name the pattern and point at the specific function to extract. Never just say "split it up".

## Edge cases — common classifications

- **Zustand store file** = domain (state transitions). Hooks consuming it + driving UI = controller.
- **Zod schema** = domain. Test with `safeParse(valid)` and `safeParse(invalid)`.
- **Pure React component** (no state, no effects, no store reads) = trivial. Skip.
- **Effectful hooks** (`useChatScroll`, `useIntentManager`) = controller. Integration-test.
- **Express middleware** = controller. Integration-test with real request lifecycle.
