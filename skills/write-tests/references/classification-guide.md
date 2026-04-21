# Code Classification — Khorikov's Quadrant (detailed)

The classification grid has two axes:

- **Domain significance** — does the code enforce business rules, transform data according to a contract, or hold branching logic that matters to the caller? Short code can still be high-significance. A 3-line function enforcing `endDate >= startDate` is domain code. A 40-line function that glues together three services is not.
- **Collaborators** — how many external modules does the code call into? Stores, databases, APIs, loggers, other services. A pure function has 0. A controller has many.

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

## Test-value ranking (spend tokens here first)

1. **Domain** — highest ROI. Protects the business rules, fast to run, survives refactors.
2. **Controller** — necessary but lower ROI per test. One happy-path integration test per controller is usually enough.
3. **Trivial** — negative ROI. Tests re-assert hardcoded values.

If tokens are limited, write domain tests first.

## Test type per category

| Category | Test type | Test doubles |
|---|---|---|
| **Domain** | Unit test — all branches, edge cases | None — pure functions |
| **Controller** | Integration test — happy path only | Mocks for unmanaged deps only, real managed deps |
| **Trivial** | Skip | — |
| **Overcomplicated** | Refactor first, then test the pieces | — |
| **LLM-boundary** (codebase extension, not Khorikov canon) | Unit test the deterministic part (context/prompt building) | Mock the API call |

## Humble Object pattern (for overcomplicated code)

Khorikov's canonical move when code is overcomplicated:

1. **Extract** the domain logic (branching, validation, business rules) into a pure function → becomes quadrant 1 (Domain).
2. **Leave behind** the thin orchestrator that wires the domain function to collaborators → becomes quadrant 3 (Controller).
3. **Test both normally** — unit test the extracted domain function (every branch), integration test the orchestrator (happy path).

When proposing "refactor first" to the user, name the pattern and point at the specific function to extract. Don't just say "it's too complex — split it up".

## Domain significance — watch for these

- Business rules (`if user.tier === 'free' && count > 10 → reject`)
- Format parsing/serialization (SSE, CSV, JSON protocol, URL builders)
- Validation / invariants
- State machines / status transitions
- Calculations (pricing, taxes, rankings, similarity)
- Error classification (mapping error shapes to domain types)

All of the above are **domain code even when short**. Don't mark them trivial.

## Collaborators — what counts

- Database/ORM calls
- HTTP fetches
- Store reads/writes (Zustand, Redux)
- Filesystem I/O
- Logger / metrics (infrastructure — usually fine to ignore when counting)
- Other service/module imports that do I/O

Pure utilities (lodash, date-fns, Zod schemas) do NOT count as collaborators.

## Edge cases

- **Zustand stores**: the store file itself is domain (state transitions). Hooks that consume it + drive UI are usually controllers.
- **Zod schemas**: domain. Test with `safeParse(valid)` and `safeParse(invalid)`.
- **Pure React components** with no state, no effects, no store reads: trivial. Skip.
- **Effectful hooks** (useChatScroll, useIntentManager): controllers. Integration-test.
- **Middleware**: usually controllers. Integration-test with a real request lifecycle.
