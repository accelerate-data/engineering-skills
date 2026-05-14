# Decision and Reaction Test Shapes

Every unit case is one or the other. Mixing them = integration.

## Decision tests

Question: *given frozen state S, does the skill correctly emit decision D?*

The variants — all are decision tests:

| Variant | Decision asserted | Example |
|---|---|---|
| **Classification** | A category / type / verdict | `classifying-data-intents` returns `{action: work, type: transformation, confidence: high}` for a fresh-build prompt |
| **Verdict** | APPROVE / APPROVE_WITH_WARNINGS / BLOCK + issue codes | `requirements-reviewer` returns BLOCK on an intent missing success criteria |
| **Routing** | Which sub-skill / phase / track to load | Coordinator dispatches `running-dbt-in-duckdb-sandbox` when `destination.type == duckdb` |
| **Command shape** | Specific shell command form | `running-dbt-in-duckdb-sandbox` emits `dbt build --select X --defer --state Y`, not `dbt build --select +X` |
| **Halt / proceed** | Whether to stop or continue | Phase-0 gate halts on `target=snowflake` with terminal `unsupported_adapter` |
| **Sub-skill invocation** | Which downstream skill to invoke, with what args | Coordinator invokes `managing-intent-design-docs` in `intake-and-enrich` mode after Phase-0 classification |

### Mechanics

- The skill runs against the case's frozen context.
- The surface that would trigger the consequence is **stubbed** — Skill tool (most common), Bash, Write, etc.
- The harness captures the call's input args (for sub-skill invocation / command shape) or the skill's structured output (for classification / verdict).
- Assertion is against the captured value, not against what would have happened next.

### What this catches

- Misclassification regressions (a typed prompt suddenly classified as ambiguous)
- Routing drift (a skill silently loads the wrong sub-skill after an edit)
- Command-shape regressions (the `+<model>` selector creeping back in after a skill change)
- Verdict drift (a reviewer suddenly approving what it used to BLOCK)

## Reaction tests

Question: *given the skill starts at frozen state S, what does it produce?*

The variants:

| Variant | Output asserted | Example |
|---|---|---|
| **Render / scaffold** | Files written, content matches template + variable substitution | `scaffolding-duckdb-workspace` produces `profiles.yml`, `sources.yml`, etc. with correct values from `vd-domain.yml` |
| **Generator** | Structured artifact + compile/parse check | `generating-dbt-model` produces SQL that parses + has expected CTEs |
| **Doc author** | Markdown with required headings and link structure | `managing-intent-design-docs` produces `intent.md` with all required sections |
| **Procedure side-effect** | A specific small fixture mutation | `pinning-dlt-schema` writes `schema_contract` block to the named YAML |

### Mechanics

- Case provides `fixture/` + `env.json` + `prompt.md` (and rarely `messages.json`).
- No stubs — the skill runs against real disk.
- Harness diffs the produced files against `expected.json` (schema + selected exact-match assertions).

### What this catches

- Template regressions (a scaffolder dropping a required field)
- Generator regressions (a model file missing the contract block)
- Doc-author regressions (a required heading silently removed)

## When to split a single section

If a section both makes a decision AND produces output, split:

- Decision case: assert the decision (with the production stubbed)
- Reaction case: pre-set the decision in the context, assert the output

This keeps each failure mode pinpointed to one of the two shapes.

## When to give up and write an integration test

If asserting the decision is meaningless without verifying the consequence (e.g. the value of a sub-skill's invocation only matters in combination with what the sub-skill then does), the behavior is genuinely emergent — escalate to the integration / benchmark suite. Don't try to force it into a unit shape.
