# Promptfoo DB Gate

Do not run the full promptfoo eval suite by default in the PR phase. For each candidate eval, compare the latest fully passing promptfoo DB run with the latest content-relevant Git change.

## Decision Rules

| Condition | Decision |
|---|---|
| DB missing, unreadable, or ambiguous | Run targeted eval. |
| No fully passing DB run exists | Run targeted eval. |
| Latest content-relevant change is newer than latest passing DB run | Run targeted eval. |
| Latest passing DB run is newer than latest content-relevant change | Skip targeted eval. |

Print evidence for every eval decision: eval command, mapped inputs, latest content-relevant change time or `no content-relevant change`, latest passing DB run time or `none`, and `run` or `skip`.

## Candidate Inputs

Build candidates from changed skills, commands, and eval infrastructure. Example mapping for `eval:raising-linear-pr`:

- `skills/raising-linear-pr/**`
- `tests/evals/packages/raising-linear-pr/**`
- `tests/evals/prompts/skill-raising-linear-pr.txt`
- `tests/evals/assertions/check-linear-skill-contract.js`

Shared harness changes such as `tests/evals/scripts/promptfoo.sh`, `tests/evals/package.json`, `tests/evals/package-lock.json`, or shared assertion helpers mark every affected eval stale unless a narrower dependency is clear.

## Helper

Use `skills/raising-linear-pr/scripts/promptfoo-db-gate.js`.

```bash
node skills/raising-linear-pr/scripts/promptfoo-db-gate.js \
  --command eval:raising-linear-pr \
  --description "Raising-linear-pr skill — verification, AC completion check, PR creation, and In Review transition" \
  --db tests/evals/.promptfoo/promptfoo.db \
  --base "$(git merge-base HEAD origin/main)" \
  --head HEAD \
  --path skills/raising-linear-pr \
  --path tests/evals/packages/raising-linear-pr \
  --path tests/evals/prompts/skill-raising-linear-pr.txt \
  --path tests/evals/assertions/check-linear-skill-contract.js
```

The helper performs the equivalent of:

```bash
git log -1 --format=%cI "$(git merge-base HEAD origin/main)"..HEAD -- <mapped-input-paths>
```
