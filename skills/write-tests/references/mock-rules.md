# Mock Rules — Managed vs Unmanaged, Stub vs Mock

## Managed vs Unmanaged Dependencies (Khorikov)

The single most important call when writing integration tests.

| Type | Examples | Use real or mock? |
|---|---|---|
| **Managed** (you own it, inside your process) | Your database, your filesystem, your Zustand store, your services | **Use real** (in-memory SQLite, tmp dir, real store with reset) |
| **Unmanaged** (outside your process, you don't control it) | External APIs (Anthropic, GitHub, Fabric), email gateway, browser `fetch`, third-party webhooks | **Mock** |
| **Infrastructure** (observability, not behaviour) | `clientLogger`, `pino` logger | Mock (not asserted on) |

Mocking a managed dependency is the #1 anti-pattern in integration tests. It turns the test into a test of the mock, not the code.

## Stub vs Mock (Khorikov distinction)

| Type | Direction | Purpose | Assert on it? |
|---|---|---|---|
| **Stub** | Inbound — provides canned answers TO the system | Set up preconditions | ❌ Never — asserting on your own stub is circular |
| **Mock** | Outbound — verifies calls FROM the system | Verify behaviour | ✅ Only when the call IS the observable behaviour (email sent, event emitted) |

If you find yourself writing `expect(stubbedFetchReturningFakeUser).toHaveBeenCalled()` — stop. You're asserting your setup worked. That tests nothing.

## When to Mock — Decision Table

| Dependency | Real or mock? | Example |
|---|---|---|
| External API (Anthropic, GitHub, Fabric) | **Mock** — unmanaged | `vi.stubGlobal('fetch', vi.fn())` |
| Browser APIs (timers, scrollHeight, IntersectionObserver) | **Mock** — unavailable in test env | `vi.useFakeTimers()` |
| Your own database | **Real** — managed, in-memory SQLite | `new Database(':memory:')` |
| Your own Zustand store | **Real** — managed, reset in `beforeEach` | `useChatStore.getState().reset()` |
| Your own service modules | **Real** — managed | Import the real service |
| Logger / metrics (`clientLogger`, `logger`) | **Mock** — infrastructure, not behaviour | `vi.mock('@/lib/client-logger')` |
| TanStack Query client | **Real** — managed | `new QueryClient()` per test |
| React component (child) that's heavy or irrelevant | **Mock** — at module boundary, minimal shape | `vi.mock('../HeavyChild', ...)` |

## Module Boundary Mocking (FE component tests, last resort)

When a store or service has side effects you cannot control in a component test, mock at the **module boundary**:

```typescript
vi.mock('@/store', () => ({
  useChatStore: { getState: () => ({ messages: [] }), setState: vi.fn() },
}));
```

Return minimal shape, NOT fake behaviour. Reach for this last — prefer importing the real store and resetting it.

## The "are you testing the mock?" check

After writing an integration test, ask:

1. If I delete the implementation and replace it with `throw new Error('not implemented')`, does my test still pass?
2. If I refactor the implementation (rename a helper, inline a call), does my test break even though behaviour is identical?

If #1 is yes → you're testing the mock, not the code.
If #2 is yes → you're testing implementation details, not behaviour.
