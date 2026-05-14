# Assertions

Three classes. Cost ratio ≈ 1:1:50 (structural : exact : judge).

## Ordering rule

Walk the list top-to-bottom. Use the first class that can express what you care about. Skipping ahead to the judge because "structural feels limiting" is the classic suite-rot starter.

## Structural — always reach first

Free, deterministic, debuggable. Cover:

| Check | Mechanism |
|---|---|
| JSON conforms to schema | JSON Schema validation |
| File exists at path | `fs.existsSync` |
| Field is in enum | string equality against allowed set |
| Item count | `array.length === N` |
| Markdown has headings | regex on heading lines |
| SQL parses / dbt compiles | dbt parse exit code |
| Regex match in output | RegExp |

Most decision tests need nothing more than schema + 1–3 field equality checks. Most reaction tests need file-existence + schema on the produced JSON / markdown structure.

Express as JS predicates in `expected.json`:

```json
{
  "type": "javascript",
  "value": "JSON.parse(output).action === 'work' && JSON.parse(output).type === 'transformation'"
}
```

Or load a per-case asserter that returns `{ pass: boolean, reason: string }`.

## Exact / set match

Use when the spec admits one or a small enumerated set of correct answers AND the value is short.

| Good | Bad |
|---|---|
| `verdict === "APPROVE"` | `summary === "the intent looks good and is approved"` |
| `set(emitted_models) === set(["dim_account", "dim_user"])` | `output.includes("we built the models")` |

Brittle to wording. Use only where wording shouldn't drift (enum fields, structured arrays). For prose output, fall through to structural (regex on heading) or to judge.

## LLM-as-judge — last resort

Only for genuinely creative output where neither structural nor exact match captures quality (generated SQL passing a stylistic bar, design docs reading sensibly, etc.).

**Rules:**

1. **Pin the judge model to a specific version string.** Never use a moving alias (`claude-sonnet-4-5` ≠ `claude-sonnet-4-5-20250929`). The judge's "opinion" changes when the model changes — reproducibility dies.
2. **Constrain output to a JSON schema.** Force the judge to return `{ pass: boolean, score: 0..1, evidence: string }`. Free-form judges are unparseable.
3. **Require evidence quoting before scoring.** "Quote the part of the candidate output that supports your verdict, then score" — prevents hallucinated approvals.
4. **Multi-pass with aggregation.** Run 3× per case, aggregate (median or majority). Single-pass judging is too noisy for CI gates.
5. **Calibrate against a small human-labeled set.** If the judge disagrees with humans on >10% of cases, the judge prompt is wrong — fix the prompt, don't accept the noise.

Costs are real: a multi-pass judge on 30 cases is ~90 LLM calls per suite run. Reserve it for cases that genuinely need it.

## Per-case configuration shape

```json
{
  "assertions": [
    { "class": "structural", "type": "json-schema", "schema": "schemas/classification.json" },
    { "class": "exact",      "type": "field-equals", "path": "type", "value": "transformation" },
    { "class": "structural", "type": "field-in-enum", "path": "confidence", "enum": ["low", "medium", "high"] }
  ]
}
```

Composite cases combine multiple assertions — each must pass for the case to pass.

## What NOT to assert

- The skill's *internal reasoning* (only the output matters)
- Things the skill is **not** responsible for (the model's general capabilities, fixture validity, etc.)
- Properties that vary run-to-run for legitimate reasons (timestamps, IDs, random suffixes — strip them before comparison or assert structure only)
- Properties whose stability isn't worth the maintenance cost (extra prose, minor wording drift)

## Flake budget

Even with temperature=0 and pinned models, slice evals can be flaky. Establish budget per case on first authoring:

1. Run the case 10× back-to-back.
2. Record pass/fail count.
3. <10 passes? The case is flaky — narrow the assertion, switch to structural-only, or rework the case before adopting into CI.

A 10/10 case is solid. A 9/10 case is acceptable IF you understand the failure mode (e.g. one mode-collapse rephrasing). A <9/10 case is flake debt — don't merge it.
