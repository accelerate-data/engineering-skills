# Mocking — Managed vs Unmanaged, Stub vs Mock

We follow the **Classical school**, not the London school.

- **Classical:** test units of behaviour (may involve multiple classes), mock only at system boundary
- **London:** mock every collaborator → produces false positives on every refactor (violates Pillar 2)

## Stub vs Mock

| Type | Direction | Purpose | Assert on it? |
|---|---|---|---|
| **Stub** | Incoming — canned answers TO the system | Set up preconditions | ❌ Never — asserting on your own stub is circular |
| **Mock** | Outgoing — verifies calls FROM the system | Verify behaviour | ✅ Only when the call IS the observable behaviour |

**The circular trap:** `vi.mocked(getUser).mockReturnValue(user)` then `expect(getUser).toHaveBeenCalled()`. You told the mock to return data, then verified the mock was called. Tests nothing.

## Dependency decision table

| Dependency | Mock? | Example |
|---|---|---|
| External API (Anthropic, GitHub) | ✅ Unmanaged — mock | `vi.stubGlobal('fetch', vi.fn())` |
| Browser APIs (timers, fetch, IntersectionObserver) | ✅ Unavailable in test env — mock | `vi.useFakeTimers()` |
| Your own database | ❌ Managed — use real (in-memory SQLite) | `new Database(':memory:')` |
| Your own Zustand store | ❌ Managed — reset in `beforeEach` | `useChatStore.getState().reset()` |
| Your own service modules | ❌ Managed — import real | — |
| Logger / metrics | ✅ Infrastructure — mock, don't assert on | `vi.mock('@/lib/client-logger')` |
| TanStack QueryClient | ❌ Managed — new per test | `new QueryClient()` |
| React child component (heavy/irrelevant) | ✅ Last resort — module-boundary with minimal shape | `vi.mock('../HeavyChild', ...)` |

**On databases:** Khorikov argues against in-memory fakes (transaction semantics, constraint enforcement diverge from real DB). For integration tests, use the real DB. For unit tests, don't involve the DB at all.

## Module boundary mocking (React components, last resort)

When a store has side effects you cannot control in a component test:

```ts
vi.mock('@/store', () => ({
  useChatStore: { getState: () => ({ messages: [] }), setState: vi.fn() },
}));
```

Return minimal shape, NOT fake behaviour. Prefer importing the real store and resetting it.

## "Are you testing the mock?" self-check

After writing an integration test, ask:

1. If I delete the implementation and replace it with `throw new Error('not implemented')`, does my test still pass? → **Yes = testing the mock, not the code.**
2. If I refactor the implementation (rename a helper, inline a call), does my test break even though behaviour is identical? → **Yes = testing implementation details.**

## Integration testing rules

| Rule | Why |
|---|---|
| Integration tests = happy path only | Edge cases are cheaper in unit tests |
| Use real managed deps (DB, store) | Mocking them means you're not testing the actual code |
| Mock only unmanaged deps | External calls are slow, flaky, cost money |
| Max 3 layers of indirection | More = design smell |
