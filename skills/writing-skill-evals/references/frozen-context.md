# Frozen Context

How to construct the "given" for a slice eval. Four layers, used in priority order.

## File anatomy per case

```
tests/evals/units/<skill-name>/cases/<case-id>/
├── prompt.md           # required — the triggering user turn
├── fixture/            # optional — disk state the skill reads
├── env.json            # optional — variables/paths the skill reads at runtime
├── messages.json       # rare    — conversation prefix (escape hatch)
├── unitconfig.json     # required — declares mode, stubs, assertions
└── expected.json       # required — assertion targets
```

A case omits any layer it doesn't need. Most cases are `prompt.md` + `fixture/` + `expected.json`.

## Layer priority (use the cheapest viable)

### 1. Disk fixture (`fixture/`) — default

Most skills read files. A fixture directory is:

- Reproducible across machines and CI
- Diffable in PRs (reviewers can see exactly what state the test pins)
- Easy to construct (copy from a real workspace, trim)
- Resilient to prompt edits (no rewrites needed when wording changes)

Conventions:
- Use **realistic minimal** fixtures — strip everything not under test, but keep what the skill actually reads.
- Name fixtures by what they represent, not by case (e.g. `fixture/intent-without-success-criteria/` not `fixture/case03/`). Cases reference fixtures by symlink or path; common fixtures get reused.
- Binary blobs (DuckDB files, etc.) belong in a shared `fixtures/_shared/` at the suite root, referenced by symlink or copy.

### 2. Environment (`env.json`)

For variables the skill reads at runtime (paths, workspace identifiers, feature flags). Shape mirrors what the live system injects:

```json
{
  "VD_WORKSPACE": "/path/to/fixture",
  "VD_PROD_MANIFEST_PATH": "prod-manifest",
  "VD_DOMAIN_TYPE": "duckdb"
}
```

The harness exports these into the skill's process. Empty / absent = inherits from CI.

### 3. Triggering prompt (`prompt.md`)

The user turn that initiates the section under test. Always present, always minimal — single intent, no preamble, no setup language. The skill must do the work; the prompt only triggers it.

For decision tests, the prompt is the *input being classified / routed / reviewed*.
For reaction tests, the prompt is the *task that triggers production*.

### 4. Conversation prefix (`messages.json`) — escape hatch only

Only when prior turn decisions genuinely live in conversation rather than on disk (e.g. testing a Phase 3 section where Phase 0–2 outputs informed the agent in chat, not in files).

**Iron rule: capture, never hand-author.**

Hand-authored prefixes rot. Every prompt edit invalidates them. Every model behavior change requires rewriting them. Capture from a real run instead:

```bash
# capture-prefix workflow
ad-evals capture-prefix \
  --skill <skill-name> \
  --case <case-id> \
  --truncate-after <message-uuid>
```

The harness writes `messages.json` with the captured prefix. When the upstream skill changes, re-capture; don't edit.

## Sharing fixtures across cases

A single fixture often supports many cases — typical, boundary, adversarial. Three options:

1. **Symlink** — `cases/<id>/fixture` → `_shared/intent-typical/`. Cleanest; CI-friendly if symlinks are preserved.
2. **Copy with override** — `fixture/` shadows shared fixture; harness merges base + case overlay. More flexible; more harness logic.
3. **Path reference in unitconfig** — `{"fixture": "_shared/intent-typical"}`. Simplest config; no symlink dependency.

Pick one and stick to it across the suite. The harness implementation determines which is easiest.

## What NOT to put in the context

- Tokens, credentials, real customer data — strip or replace with synthetic values
- Anything the skill should derive itself (defeats the test)
- Generic boilerplate from real intent dirs that isn't read by the skill — trim aggressively
- Snapshots of long agent transcripts when a small fixture would do the same job
