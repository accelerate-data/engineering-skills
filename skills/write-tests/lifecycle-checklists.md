# Lifecycle Boundary Checklists

**Stateful code has lifecycle boundaries.** Any code that holds state across time (refs, connections, sessions, caches, subscriptions) can lose, leak, or corrupt that state at lifecycle transitions.

The standard rule: **for any stateful code, identify the lifecycle transitions and check what happens to the state at each boundary.**

Common lifecycle boundary questions:

- What happens to state when the owner is destroyed and recreated?
- What happens to subscriptions/listeners when they're torn down?
- What happens to in-flight operations when the context disappears?
- What happens to shared state when one consumer disconnects?

## Frontend Lifecycle Checklist

For React hooks and components that manage stateful refs, subscriptions, or DOM state:

| Boundary              | Check                                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| Mount/unmount/remount | Is state preserved or lost when the component unmounts and remounts? (e.g., navigation away and back) |
| Conditional rendering | Does the code handle the element being absent from the DOM, then reappearing?                         |
| Ref persistence       | Do refs survive across renders? Are callback refs re-invoked correctly?                               |
| Subscription cleanup  | Are event listeners, intervals, and observers removed on unmount?                                     |
| Stale closures        | Do effects close over stale state when dependencies change?                                           |

Use `renderHook` with `unmount()` + fresh `renderHook()` to test remount scenarios. These are testable at the unit level — no browser or E2E required.

## Backend Lifecycle Checklist

For services, middleware, and infrastructure that manage connections, sessions, or shared state:

| Boundary                 | Check                                                                                           |
| ------------------------ | ----------------------------------------------------------------------------------------------- |
| Connection lifecycle     | What happens when a DB connection / WebSocket / SSE stream drops and reconnects?                |
| Request lifecycle        | Does middleware properly pass, skip, or error without leaking state to the next request?        |
| Session/token lifecycle  | What happens at creation, refresh, expiry, and invalidation? Is stale session state cleaned up? |
| Transaction lifecycle    | What happens on commit, rollback, and partial failure? Is state consistent after rollback?      |
| Graceful shutdown        | Are in-flight operations completed or cleanly aborted? Are resources released?                  |
| Cache/rate-limiter state | What happens on eviction, window reset, or cold start after restart?                            |
| Stream lifecycle         | What happens on client disconnect mid-stream? Is cleanup triggered?                             |

Use dependency injection to test these. Lifecycle bugs are among the hardest to catch in production — surface them early.
