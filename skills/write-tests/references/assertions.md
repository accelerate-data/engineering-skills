# Assertion Style Hierarchy — Output > State > Communication

Khorikov's three styles of unit test, ranked. **Always reach for the top first.**

## 1. Output-based (best — reach for this first)

Feed input, assert on return value. No side effects.

```ts
expect(parseSSEBuffer(input)).toEqual(expectedOutput);
expect(classifyError(stderr)).toBe('auth_failed');
expect(calculatePrice(items, coupon)).toBe(42.50);
```

**Why it's best:** survives any refactor, zero mock surface, fast, trivially readable.
**When available:** pure functions, Zod schemas (`safeParse` returns a value), stateless calculations.

## 2. State-based (next best)

Perform action, assert on state AFTER.

```ts
useStore.getState().selectDomain('x');
expect(useStore.getState().selectedDomain).toBe('x');

const { result } = renderHook(() => useSomething());
act(() => result.current.doThing());
expect(result.current.value).toBe('expected');

await service.create({ name: 'foo' });
const row = db.query('SELECT * FROM items WHERE name = ?').get('foo');
expect(row).toBeDefined();
```

**When available:** stateful objects with clean "read current state" access.

## 3. Communication-based (last resort)

Assert that the system CALLED something — an outbound message to the outside world.

```ts
await service.sendWelcomeEmail(user);
expect(emailGateway.send).toHaveBeenCalledWith({ to: user.email, template: 'welcome' });

await service.placeOrder(order);
expect(eventBus.emit).toHaveBeenCalledWith('order.placed', { id: order.id });
```

**Only valid when:** the outbound call IS the business-observable effect (email sent, event emitted, external webhook).

**Never valid for:**
- Internal helper calls (`expect(calculateSubtotal).toHaveBeenCalledTimes(3)`)
- Calls into your own modules
- Verifying stub setup worked (circular)

## The ladder in practice

When writing a test, ask in order:

1. Can I assert on a return value? → **Output-based**
2. Can I assert on observable state after the action? → **State-based**
3. Is the outbound call itself the business-observable effect? → **Communication-based** (carefully)
4. None of the above? → You're testing an implementation detail. Re-read the public API.

**Why this matters for Pillar 2:** output-based assertions only break when behaviour changes. Communication-based break whenever code is restructured — even when behaviour is identical. Higher on ladder = more refactor-proof.
