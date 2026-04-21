# Auditing Existing Tests — Checklist

When a source file has colocated tests, audit them against the 4 Pillars before writing new ones.

## Per-pillar audit checks

### Pillar 1 — Regression protection

- Do assertions verify meaningful observable outcomes (return values, state, response body)?
- Any trivial assertions (`toBeInTheDocument()` alone with no further check)?
- Any circular assertions (asserting on mock return values you set up)?

### Pillar 2 — Refactoring resistance

- Are assertions on observable behaviour (`getState()`, `result.current`, response body)?
- Any assertions on implementation details (`toHaveBeenCalledWith` on internal helpers)?
- Are integration tests mocking **managed** deps (own stores/services/DB)? They shouldn't.
- Are unit tests using mocks at all? They shouldn't — domain code has no collaborators.

### Pillar 3 — Fast feedback

- Any `setTimeout`, `sleep`, or real network in unit tests?
- Any real filesystem writes (vs. in-memory)?
- Does the file run in reasonable time (unit <5s, integration <30s)?

### Pillar 4 — Maintainability

- AAA structure clear?
- One behaviour per test (name reads as a requirement)?
- Test body under ~15 lines (excluding factory calls)?
- Setup not longer than the test itself?

## Conventions

- File naming: unit = `*.test.ts`, integration = `*.integration.test.ts`
- Classification match: domain → unit file, controller → integration file
- No `fireEvent` in component tests (use `userEvent.setup()`)
- Query by role/text, not CSS class

## Test organisation — per behaviour, not per method

```
❌ describe('calculateTotal') → it('test calculateTotal') → it('test with discount')
✅ describe('order pricing') → it('applies percentage discount') → it('caps at order total')
```

Per-method tests couple to API surface. Rename the method → all tests break. Per-behaviour tests survive refactors.

## Audit report template

```
**Audit of `{filename}`** ({N} tests)

**4 Pillars:**
- {✅/⚠️} **P1 Regression protection:** {findings}
- {✅/⚠️} **P2 Refactoring resistance:** {findings}
- {✅/⚠️} **P3 Fast feedback:** {findings}
- {✅/⚠️} **P4 Maintainability:** {findings}

**Conventions:**
- {✅/⚠️} File naming: {findings}
- {✅/⚠️} Classification match: {findings}

**My recommendation:** {Keep as-is / Fix N pillar violations / Rewrite}

**Concrete fixes I'd make:**
1. {specific fix}
2. {specific fix}
```

Always end the audit with a concrete recommendation — never leave the user to decide without one.

## When to delete an existing test

- Asserts on implementation details, breaks on every refactor (high cost, low benefit)
- Duplicates another test at a different level (unit + integration covering same happy path)
- Tests trivial code (getters, one-line pass-throughs)
- Written just to hit a coverage number

Fewer, better tests > more, worse tests.
