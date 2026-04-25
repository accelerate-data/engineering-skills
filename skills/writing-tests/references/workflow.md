# Writing Tests Workflow

Use this reference after `SKILL.md` has selected a mode.

## Hard Gate

Do not read production source files, write tests, or run commands until all three are visible in the conversation:

1. Checklist/plan with the five workflow steps
2. Declared mode: TDD, While-building, Post-feature, Update, or Review
3. Confirmed source file list, or TDD requirement/spec-derived target

If the prompt is vague, ask one mode question and stop. "Write tests for X", "add tests for the Y part", and "test this feature" do not declare a mode. Do not ask mode and scope together. Do not run discovery, inspect files, post the checklist, or infer a mode before the user answers.

In TDD mode, you may read the user-provided requirement/spec before posting the planned target. Do not read implementation files.

Zero exceptions: not for small files, obvious tests, time pressure, or a specific file named in the prompt. If this gate was skipped, stop, discard any draft tests, and restart here.

## Discovery

Run before Step 1 in non-TDD modes. Stop when you have a file list.

1. `git diff origin/main --name-only`
2. Linear issue body, if issue context is present
3. Explicit file or feature name from the user
4. Codebase search for the feature name

Filter out test, config, and generated files. Rank Domain first, Controller second, Trivial skipped.

Present:

```markdown
Found N files to test. Proposed order: `file-a.ts` (Domain), `file-b.ts` (Controller), `config.ts` (Trivial - skip). Proceed?
```

Do not start Step 1 without confirmation.

In Update mode, use the changed source list to identify existing tests that cover those files before editing tests in place.

## Step Rules

### Step 1 — Classify

Read source in non-TDD modes. In TDD mode, read the requirement/spec and planned public API.

Use `references/classification.md`. Apply `lifecycle-checklists.md` when code manages state across time.

### Step 2 — Audit Existing Tests

Actively check for colocated `__tests__/`, `*.test.*`, or `*.spec.*` files. If present, audit against the 4 Pillars before writing new tests. If absent, report that you checked.

Use `references/audit.md`.

### Step 3 — Recommend Behaviours

Lead with a recommendation. Do not ask the user to invent the list.

Post this exact marker before approval:

```markdown
## Approved behaviours

| # | Behaviour | Scenario |
|---|-----------|----------|
| 1 | ...       | ...      |
```

Wait for user approval before Step 4.

Do not vary the marker text. The required header is exactly `## Approved behaviours`; alternatives like "Proposed tests" or "Behaviours to cover" do not satisfy the gate. The marker plus user approval are both required before writing tests.

Before writing, ask: "what plausible bug could still pass this suite?" If you can name one, add it. If not, state that explicitly.

### Step 4 — Write Tests

Discover the test runner before writing framework-specific syntax.

Use assertion hierarchy from `references/assertions.md`: output > state > communication.

Use mocking rules from `references/mocking.md`: mock unmanaged external dependencies only; use real managed dependencies.

### Step 5 — Run and Report

When a test fails:

1. If it asserts desired behaviour and existing code violates it, outside TDD leave it red and report the bug. Do not weaken the test or fix source.
2. In TDD, the expected RED failure does not count as a post-feature bug and is not left red as evaluator output. End the RED companion phase, then hand control to `superpowers:test-driven-development` for GREEN when available, or state that the local fallback will continue with GREEN/REFACTOR as a separate TDD step.
3. If the test assumption is wrong, fix the test, maximum three attempts.

Report:

```markdown
## Test Results
| File | Test type | Category | Tests | Pass | Fail | Skipped |

### Audit findings (from Step 2)
### Bugs discovered (red tests)
- {file}:{test} - **desired:** X. **actual:** Y. Left failing intentionally.
### Skipped files
### Rename recommendations
```

The report must include Step 2 audit findings.

## Framework Detection

Discover once per session:

1. `repo-map.json` -> `test_frameworks`
2. `package.json` -> `scripts.test` and dev dependencies
3. `pyproject.toml` -> pytest
4. `pytest.ini` or `setup.cfg`
5. `Makefile` test target
6. Ask the user only if still ambiguous

Use the discovered runner for the session.
