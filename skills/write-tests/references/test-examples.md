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
- No `vi.mock`, no `vi.fn()`. If you need them, it's an integration test.
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

## Integration Test — Hook with Store (State-based)

**File:** `{source-name}.integration.test.ts`

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

## Integration Test — Express Route (State-based)

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../app';
import { createDb, closeDb } from '../../../db/memory';

describe('POST /api/domains', () => {
  let app: ReturnType<typeof createApp>;
  let db: ReturnType<typeof createDb>;

  beforeEach(() => {
    db = createDb();  // in-memory SQLite — MANAGED, use real
    app = createApp({ db });
  });

  afterEach(() => closeDb(db));

  it('creates a domain and returns 201 with the new id', async () => {
    const res = await request(app)
      .post('/api/domains')
      .send({ name: 'new-domain' })
      .expect(201);

    expect(res.body.id).toBeDefined();
    const row = db.query('SELECT * FROM domains WHERE id = ?').get(res.body.id);
    expect(row.name).toBe('new-domain');
  });
});
```

**Rules:**
- Use in-memory SQLite, not mocks.
- Assert on response AND real DB state.
- Don't mock your own services — wire them up for real.

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

## Factory Pattern (for integration tests with complex state)

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
