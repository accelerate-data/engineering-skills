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

**On databases:** Khorikov argues against in-memory fakes (transaction semantics, constraint enforcement diverge from real DB). A unit test of domain logic should not involve the DB at all. A test that needs a real DB across modules or over HTTP is a flow / e2e test owned by the repo's higher layer — keep it out of `*.test.ts` unit files.

## Module boundary mocking (React components, last resort)

When a store has side effects you cannot control in a component test:

```ts
vi.mock('@/store', () => ({
  useChatStore: { getState: () => ({ messages: [] }), setState: vi.fn() },
}));
```

Return minimal shape, NOT fake behaviour. Prefer importing the real store and resetting it.

## "Are you testing the mock?" self-check

After writing any test, ask:

1. If I delete the implementation and replace it with `throw new Error('not implemented')`, does my test still pass? → **Yes = testing the mock, not the code.**
2. If I refactor the implementation (rename a helper, inline a call), does my test break even though behaviour is identical? → **Yes = testing implementation details.**

## Flow / end-to-end tests — not authored here

This skill writes unit and component tests only. Behaviour that needs the full app, a real DB over HTTP, or several real services wired together is a flow / end-to-end test owned by the repo's higher test layer. Do not author it here, and do not disguise it as a `*.test.ts` unit file. The managed-vs-unmanaged discipline above still governs wherever such a test lives: real managed deps, mock only unmanaged ones, happy path, max ~3 layers of indirection.
