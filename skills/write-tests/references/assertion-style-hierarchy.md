# Assertion Style Hierarchy — Output > State > Communication

Khorikov's three styles of unit test, ranked by quality. **Always reach for the top of the list first.** If a style is unavailable for a given piece of code, step down — don't leapfrog.

## 1. Output-based (best — reach for this first)

The test feeds input to a function and asserts on the return value. No side effects involved.

```typescript
// Domain logic
expect(parseSSEBuffer(input)).toEqual(expectedOutput);
expect(classifyError(stderr)).toBe('auth_failed');
expect(calculatePrice(items, coupon)).toBe(42.50);
```

**Why it's best**: survives any refactor, zero mock surface, fast, trivially readable.

**When available**: pure functions, Zod schemas (`safeParse` returns a value), stateless calculations.

## 2. State-based (next best)

The test performs an action and asserts on state AFTER. The action causes a state change; you inspect the new state.

```typescript
// Zustand store
useStore.getState().selectDomain('x');
expect(useStore.getState().selectedDomain).toBe('x');

// Hook result
const { result } = renderHook(() => useSomething());
act(() => result.current.doThing());
expect(result.current.value).toBe('expected');

// In-memory DB after a service call
await service.create({ name: 'foo' });
const row = db.query('SELECT * FROM items WHERE name = ?').get('foo');
expect(row).toBeDefined();
```

**Why it's next**: still asserts on observable end state, but requires more setup than output-based.

**When available**: stateful objects with clean "read current state" access.

## 3. Communication-based (last resort — use sparingly)

The test asserts that the system under test CALLED something — an outbound message to the outside world.

```typescript
// An email WAS sent — the sending itself is the observable behaviour
await service.sendWelcomeEmail(user);
expect(emailGateway.send).toHaveBeenCalledWith({ to: user.email, template: 'welcome' });

// A domain event WAS emitted
await service.placeOrder(order);
expect(eventBus.emit).toHaveBeenCalledWith('order.placed', { id: order.id });
```

**Why it's last**: brittle — couples to call shape. Most uses are wrong. Most "I must assert on a mock call" instincts are actually "the output/state I really want to assert on is hiding one layer deeper."

**Only valid when**:
- The outbound call IS the business-observable effect (email sent, event emitted, external webhook fired).
- You're at the true edge of your system talking to an unmanaged dependency.

**Never valid for**:
- Internal helper calls (`expect(calculateSubtotal).toHaveBeenCalledTimes(3)`)
- Calls into your own modules (your store, your service layer)
- Verifying your setup worked (`expect(stubbedFetch).toHaveBeenCalled` — circular)

## The ladder in practice

When writing a test, ask in order:

1. Can I assert on a return value? → **Output-based** (use this).
2. Can I assert on observable state after the action? → **State-based** (use this).
3. Is the outbound call itself the business-observable effect? → **Communication-based** (use carefully).
4. None of the above? → You're probably testing an implementation detail. Re-read the public API and find the real observable behaviour.

## Why this matters for refactoring resistance (Pillar 2)

Output-based assertions only break when behaviour changes. Communication-based assertions break whenever code is restructured — even when behaviour is identical. The higher you are on the ladder, the more refactor-proof your test.
