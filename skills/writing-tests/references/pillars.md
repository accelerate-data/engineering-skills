# Khorikov's 4 Pillars + 4-Outcome Formula

Every test is judged against 4 pillars. A test that fails any pillar is worse than no test.

## The 4-Outcome Formula

|  | Code is broken | Code is working |
|---|---|---|
| **Test fails** | ✅ **True Positive** — caught a real bug | ❌ **False Positive** — noise, erodes trust |
| **Test passes** | ❌ **False Negative** — silent bug in prod (most dangerous) | ✅ **True Negative** — correct green |

**AI agents produce False Negatives** when they assert on their own mocks instead of real behaviour. Coverage looks green, production breaks.

**AI agents produce False Positives** when they couple tests to implementation details. Every refactor breaks tests, teams ignore failures.

## The 4 Pillars

| Pillar | Eliminates |
|---|---|
| **1. Protection against regressions** | False Negatives |
| **2. Resistance to refactoring** (never sacrifice) | False Positives |
| **3. Fast feedback** | Slow-suite pain |
| **4. Maintainability** | Silent test deletion |

### Pillar 1 — Protection against regressions

"What breaks if I delete the code this test covers?" must have a clear answer.

| Fails | Passes |
|---|---|
| `expect(x).toBeInTheDocument()` alone | `screen.getByText('Connection failed')` |
| Asserting on mock return values you set up | `expect(response.status).toBe(404)` |
| "Doesn't crash" without checking output | `expect(store.getState().selectedId).toBeNull()` |

### Pillar 2 — Resistance to refactoring (never sacrifice)

Test observable behaviour, not implementation details.

| Observable | Implementation |
|---|---|
| `screen.getByText('Error')` | `expect(setError).toHaveBeenCalledWith(...)` |
| `expect(response.status).toBe(404)` | `expect(findById).toHaveBeenCalled()` |
| `expect(store.getState().id).toBe('x')` | `expect(set).toHaveBeenCalledWith({...})` |
| `expect(result).toEqual({ total: 100 })` | `expect(calculateSubtotal).toHaveBeenCalledTimes(3)` |

### Pillar 3 — Fast feedback

Unit <5s/file, integration <30s/suite. No `sleep`, no `setTimeout`, no real network in unit tests.

### Pillar 4 — Maintainability

- AAA structure — if there's no Act, it's not a test
- One behaviour per test — name reads as a requirement
- Factory helpers at top of file (`makeModel()`, `makeIntent()`)
- Test body <15 lines, setup shorter than the test

**The non-negotiable:** never sacrifice Pillar 2. Brittle tests destroy trust — failures get ignored, True Positives get lost in noise.
