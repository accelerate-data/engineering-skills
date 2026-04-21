# Auditing Existing Tests — Checklist

When a source file has colocated tests, audit them against the 4 pillars + conventions before writing new ones. Output findings per the template in SKILL.md Step 2.

## Per-test-file audit checks

### Pillar 1 — Regression protection

- Do assertions verify meaningful observable outcomes (return values, state, response body)?
- Any trivial assertions (`toBeInTheDocument()` alone with no further check)?
- Any circular assertions (asserting on mock return values you set up yourself)?

### Pillar 2 — Refactoring resistance

- Are assertions on observable behaviour (`getState()`, `result.current`, response body)?
- Any assertions on implementation details (`toHaveBeenCalledWith` for internal helper calls)?
- Are integration tests mocking **managed** dependencies (own stores, own services, own DB)? They shouldn't.
- Are unit tests using mocks at all? They shouldn't — domain code has no collaborators.

### Pillar 3 — Fast feedback

- Any `setTimeout`, `sleep`, or real network calls in unit tests?
- Any real filesystem writes in unit tests (vs. in-memory)?
- Does the file run in reasonable time (unit <5s, integration <30s)?

### Pillar 4 — Maintainability

- Arrange-Act-Assert structure clear?
- One behaviour per test (test name reads as a requirement)?
- Test body under ~15 lines (excluding factory calls)?
- Setup not longer than the test itself?

### Conventions

- File naming: unit tests = `*.test.ts`, integration tests = `*.integration.test.ts`.
- Classification match: domain code → unit test file, controller code → integration test file.
- No `fireEvent` in component tests (should be `userEvent.setup()`).
- Query by role/text, not CSS class.

## Audit report template (per file)

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
