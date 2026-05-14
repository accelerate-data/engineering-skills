# Recipe Walkthrough — first slice eval for a classifier skill

Worked example. Target: `vibedata-data-engineering:classifying-data-intents`.

## 1. Identify sections

Read the skill markdown. Look for branches and reactions.

`classifying-data-intents` is monolithic — one section. Job: emit `{action, type, confidence, rationale}` JSON for any user prompt. No phases, no internal routing.

Section: **whole skill**. One decision per case.

## 2. Classify the section

The skill makes a classification decision (it doesn't produce files or invoke sub-skills). → **Decision test**, every case.

## 3. Enumerate scenarios

Aim for 6–10 cases initially. Cover:

| Category | Example prompts |
|---|---|
| Typical / clear | "Build a sales pipeline mart from Salesforce bronze" → `{work, transformation, high}` |
| Typical / clear (other axis) | "Ingest Stripe customers via dlt" → `{work, ingestion, high}` |
| Boundary (ambiguous) | "Add support for Stripe events" — could be ingestion OR transformation → `{*, ambiguous, low}` |
| Boundary (mixed) | "Ingest Stripe events AND build a churn fact" → `{work, mixed, medium}` |
| Out-of-scope | "Add a Snowflake warehouse to our infra" → `{out_of_scope, *, high}` |
| Extension task | "Add `weighted_amount` to fct_opportunity" → `{work, transformation, high}` (despite being small) |
| Adversarial | "Just run dbt" — no specifics → `{work, ambiguous, low}` |
| Resume signal | "Continue the previous intent" → `{resume, *, *}` (if the classifier handles this) |

8 cases. Each pins one classification outcome.

## 4. Choose inputs per case

Pure classifier — only `prompt.md` is needed. No fixture, no env, no messages.

```
cases/case01-fresh-transformation/
├── prompt.md          # "Build a sales pipeline mart from Salesforce bronze"
├── unitconfig.json    # declares mode, model, stubs (none), assertions
└── expected.json      # asserts {action: work, type: transformation, confidence: high}
```

## 5. Choose assertions

Output is structured JSON. Structural class.

```json
{
  "assertions": [
    {
      "type": "javascript",
      "value": "const r = JSON.parse(output); return r.action === 'work' && r.type === 'transformation' && ['high','medium'].includes(r.confidence);"
    }
  ]
}
```

Use field equality on `action` (enum), `type` (enum). Use field-in-enum on `confidence` (we tolerate "high" or "medium" for typical-case wording). Never assert on `rationale` (creative text — let it drift).

## 6. Choose execution mode

Classifier emits JSON natively → **actual run**, no dry-run suffix needed.

`unitconfig.json`:

```json
{
  "mode": "decision",
  "stubs": [],
  "dry_run": false,
  "model": "claude-sonnet-4-6-20250929"
}
```

## 7. Measure flake — run 10×

```bash
for i in {1..10}; do
  npm run eval:units:skill -- classifying-data-intents/case01-fresh-transformation
done
```

Expectation: 10/10 pass on a clear typical case. Adversarial / boundary cases may sit at 8–9/10 — accept if the failure mode is understood (wording drift, not classification error).

If any case is <8/10, narrow the assertion. If still flaky, the skill itself is uncalibrated for that input — that's a SKILL bug; surface it before adopting the case.

## What this catches

After the suite is in CI:

- A skill edit drops `confidence` from the schema → all 8 cases fail with a structural assertion error → pinpointed to schema regression
- A skill edit changes how the classifier handles ambiguity → only the 2 ambiguous cases fail → pinpointed to one branch
- A skill edit reclassifies "extension task" as `ingestion` → exactly that case fails → pinpointed to one scenario

End-to-end evals can't give you any of this resolution.

## When the recipe scales differently

- **Phased skill** (`data-engineer` Phase 0/1/2/3): one section per phase, fixture context for each (the state at phase entry). Sections share fixtures via `_shared/`.
- **Reviewer skill**: same shape as classifier, but cases are *artifact fixtures* (intent.md, design.md), not prompts. Assertion on the verdict JSON.
- **Scaffolder / generator skill**: reaction tests dominate; fixture is the input workspace, assertion is on produced files (schema + key field exact match).
- **Procedure skill** (`running-dbt-in-duckdb-sandbox`): decision tests dominate (asserting command shape via dry-run suffix). Few reaction tests, only where the procedure produces a small, deterministic artifact.
