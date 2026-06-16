# Test Examples by Code Type

Canonical file structures and assertion patterns. Use these as templates — copy, adapt, don't reinvent.

## Unit Test — Pure Function (Output-based)

**File:** `{source-name}.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { parseSSEBuffer } from '../parse-sse-buffer';

describe('parseSSEBuffer', () => {
  it('returns empty events when buffer has no complete event', () => {
    const buffer = 'data: {"type": "start"';
    const result = parseSSEBuffer(buffer);
    expect(result.events).toEqual([]);
    expect(result.remaining).toBe(buffer);
  });

  it('parses single complete event and clears remaining', () => {
    const buffer = 'data: {"type":"start"}\n\n';
    const result = parseSSEBuffer(buffer);
    expect(result.events).toEqual([{ type: 'start' }]);
    expect(result.remaining).toBe('');
  });
});
```

**Rules:**

- No `vi.mock`, no `vi.fn()` — a pure function has nothing to mock.
- Assert on the return value only.
- One behaviour per `it()`, AAA structure, test body under 15 lines.

## Unit Test — Zustand Store (State-based)

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore } from '../store';

describe('useChatStore.selectMessage', () => {
  beforeEach(() => {
    useChatStore.getState().reset();
  });

  it('sets selectedMessageId to the given id', () => {
    useChatStore.getState().selectMessage('msg-1');
    expect(useChatStore.getState().selectedMessageId).toBe('msg-1');
  });

  it('clears selectedMessageId when given null', () => {
    useChatStore.setState({ selectedMessageId: 'msg-1' });
    useChatStore.getState().selectMessage(null);
    expect(useChatStore.getState().selectedMessageId).toBeNull();
  });
});
```

**Rules:**

- Assert on `getState()`, never on `set` calls.
- Reset the store in `beforeEach` — stores persist between tests.

## Unit Test — Zod Schema

```typescript
import { describe, it, expect } from 'vitest';
import { userSchema } from '../schemas';

describe('userSchema', () => {
  it('accepts a valid user', () => {
    const result = userSchema.safeParse({ name: 'Ada', age: 30 });
    expect(result.success).toBe(true);
  });

  it('rejects negative age', () => {
    const result = userSchema.safeParse({ name: 'Ada', age: -1 });
    expect(result.success).toBe(false);
  });
});
```

## Component Test — Hook with Store (State-based)

**File:** `{source-name}.test.tsx` — in scope: jsdom, real store (managed), mock only infra. No app boot, no real DB/HTTP.

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock unmanaged/infrastructure only
vi.mock('@/lib/client-logger', () => ({
  clientLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// Import REAL store
import { useChatStore } from '@/store';
import { useChatActions } from '../use-chat-actions';

describe('useChatActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useChatStore.getState().reset();
  });

  it('selectMessage updates the store', () => {
    const { result } = renderHook(() => useChatActions());
    act(() => result.current.selectMessage('msg-1'));
    expect(useChatStore.getState().selectedMessageId).toBe('msg-1');
  });
});
```

## Not a unit test — full-app / real-DB flows

A test that boots the app, opens a real DB, and drives it over HTTP exercises many modules at once. That is a **flow / end-to-end test** owned by the repo's higher test layer — it does **not** belong in a `*.test.ts` unit file, and never in a `*.integration.test.*` file (not a valid test type here).

```typescript
// ❌ Not here: this boots createApp + a real DB and drives it over HTTP.
// It is a flow / e2e test — put it in the repo's flow layer, not a *.test.ts.
import request from 'supertest';
import { createApp } from '../../../app';
import { createDb } from '../../../db/memory';

const app = createApp({ db: createDb() });
await request(app).post('/api/domains').send({ name: 'new-domain' }).expect(201);
```

To cover this at the unit level instead, extract the pure logic (request validation, the shape of the created record) via Humble Object and unit-test that; leave the wired-up request/DB path to the flow layer.

## Communication-based Example (use sparingly)

Only when the outbound call IS the observable behaviour:

```typescript
// An email-sending service where sending is the whole point
describe('sendWelcomeEmail', () => {
  it('sends a welcome email to the user', async () => {
    const emailGateway = { send: vi.fn().mockResolvedValue({ id: 'msg-1' }) };
    const service = new UserService({ emailGateway });

    await service.sendWelcomeEmail({ email: 'ada@example.com' });

    expect(emailGateway.send).toHaveBeenCalledWith({
      to: 'ada@example.com',
      template: 'welcome',
    });
  });
});
```

Note: the mock is on an unmanaged external gateway — that's the only acceptable case.

## Component Test (FE)

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmButton } from '../ConfirmButton';

describe('ConfirmButton', () => {
  it('calls onConfirm when clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ConfirmButton onConfirm={onConfirm} />);

    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
```

**Rules:**

- `userEvent.setup()`, never `fireEvent`.
- `screen.getByRole` / `getByText`, never query by CSS class.
- Communication-based on `onConfirm` is valid here — it's the component's outbound contract.

## Factory Pattern (for tests with complex state)

```typescript
function makeState(overrides: Partial<StreamState> = {}): StreamState {
  return {
    currentMessageId: 'msg-1',
    toolCalls: {},
    ...overrides,
  };
}

// In tests
const state = makeState({ currentMessageId: 'msg-42' });
```

Keep factories at the top of the file. Use `Partial<T>` so overrides are ergonomic.
