# Eval Assertion Hardening for adversarial-review and closing-linear-issue — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the live Promptfoo packages for `adversarial-review` and `closing-linear-issue` materially more stable by tightening prompt instructions and assertion logic around scenario-bound obligations instead of incidental prose.

**Architecture:** Work package by package. First capture repeat-run evidence with isolated JSON exports. Then harden `closing-linear-issue` by splitting routing semantics from workflow semantics and reducing note-string dependence. Harden `adversarial-review` by adding contradiction checks and more explicit field semantics in the prompt. Finish with deterministic guard tests, repeated isolated reruns, and only then a repo-wide regression rerun.

**Tech Stack:** Promptfoo package configs under `tests/evals/packages/`, prompt templates under `tests/evals/prompts/`, JavaScript assertion helpers under `tests/evals/assertions/`, Node test scripts under `tests/evals/scripts/`, npm eval wrapper scripts in `tests/evals/package.json`.

---

## File Structure

| File | Responsibility |
|---|---|
| `tests/evals/packages/adversarial-review/promptfooconfig.json` | Scenario fixtures and expected boolean surfaces for `adversarial-review` |
| `tests/evals/packages/closing-linear-issue/promptfooconfig.json` | Scenario fixtures and expected boolean surfaces for `closing-linear-issue` |
| `tests/evals/prompts/skill-adversarial-review.txt` | Model instructions for `adversarial-review` eval scenarios |
| `tests/evals/prompts/skill-closing-linear-issue.txt` | Model instructions for `closing-linear-issue` routing and workflow scenarios |
| `tests/evals/assertions/check-adversarial-review-contract.js` | Deterministic contract checker for `adversarial-review` outputs |
| `tests/evals/assertions/check-linear-skill-contract.js` | Deterministic contract checker for `closing-linear-issue` and related Linear workflow skills |
| `tests/evals/scripts/ad-issues-contract.test.js` | Deterministic tests for closing-linear-issue routing and prompt contract expectations |
| `tests/evals/scripts/*.test.js` | Shared deterministic regression surface after hardening |

## Task 1: Capture a Stability Baseline

**Files:**

- No repo file changes in this task
- Output artifacts only: `/tmp/adversarial-review-*.json`
- Output artifacts only: `/tmp/closing-linear-issue-*.json`

- [ ] **Step 1: Run five isolated `adversarial-review` evals with JSON export**

Run:

```bash
cd tests/evals
for i in 1 2 3 4 5; do
  npm run eval:adversarial-review -- --no-table -o "/tmp/adversarial-review-$i.json"
done
```

Expected: five completed eval exports with pass/fail counts that can be compared case by case.

- [ ] **Step 2: Run five isolated `closing-linear-issue` evals with JSON export**

Run:

```bash
cd tests/evals
for i in 1 2 3 4 5; do
  npm run eval:closing-linear-issue -- --no-table -o "/tmp/closing-linear-issue-$i.json"
done
```

Expected: five completed eval exports with pass/fail counts that can be compared case by case.

- [ ] **Step 3: Summarize flipping fields from the exported JSON**

Run:

```bash
node - <<'NODE'
const fs = require('fs');
const paths = process.argv.slice(2);
for (const p of paths) {
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  for (const r of data.results.results) {
    if (!r.success) {
      console.log(p, '::', r.testCase?.description || '<no description>');
      console.log((r.gradingResult?.componentResults || []).filter(c => c.pass === false).map(c => c.reason).join('\n'));
    }
  }
}
NODE /tmp/adversarial-review-1.json /tmp/adversarial-review-2.json /tmp/adversarial-review-3.json /tmp/adversarial-review-4.json /tmp/adversarial-review-5.json /tmp/closing-linear-issue-1.json /tmp/closing-linear-issue-2.json /tmp/closing-linear-issue-3.json /tmp/closing-linear-issue-4.json /tmp/closing-linear-issue-5.json
```

Expected: a short list of repeated versus one-off failures, with exact failing reasons.

- [ ] **Step 4: Decide which failures are deterministic and which are provider variance**

Decision rule:

```text
- If the same case fails for the same reason in 3+ runs, treat it as a deterministic contract gap.
- If the same case alternates between pass and fail with different wording-only reasons, treat it as prompt/assertion instability.
- If a case fails once in regression but passes repeatedly in isolation, do not change the skill contract yet; harden the eval surface first.
```

Expected: a written note in the implementation session describing which failure class each package falls into.

## Task 2: Harden `closing-linear-issue` Routing and Workflow Semantics

**Files:**

- Modify: `tests/evals/packages/closing-linear-issue/promptfooconfig.json`
- Modify: `tests/evals/prompts/skill-closing-linear-issue.txt`
- Modify: `tests/evals/assertions/check-linear-skill-contract.js`
- Modify: `tests/evals/scripts/ad-issues-contract.test.js`

- [ ] **Step 1: Add failing deterministic tests for prompt semantics**

Extend `tests/evals/scripts/ad-issues-contract.test.js` with checks that the prompt explicitly states:

```js
test('closing-linear-issue prompt says routed close commands pause the current flow', () => {
  const prompt = read(path.join(EVALS_ROOT, 'prompts', 'skill-closing-linear-issue.txt'));
  assert.ok(prompt.includes('would_pause_current_flow'));
});

test('closing-linear-issue prompt says checks_off_acceptance_criteria is always false', () => {
  const prompt = read(path.join(EVALS_ROOT, 'prompts', 'skill-closing-linear-issue.txt'));
  assert.ok(prompt.includes('checks_off_acceptance_criteria'));
});
```

Run:

```bash
node --test tests/evals/scripts/ad-issues-contract.test.js
```

Expected: FAIL if the prompt does not yet pin those semantics explicitly.

- [ ] **Step 2: Tighten the routing instructions in the prompt**

Update `tests/evals/prompts/skill-closing-linear-issue.txt` so the routing branch explicitly says:

```text
If the message matches a closing-linear-issue trigger phrase and this skill should take over next, set `would_pause_current_flow=true`.
Use `would_pause_current_flow=false` only when no skill switch should happen.
```

Expected: routing cases no longer depend on the model inferring pause semantics from general context.

- [ ] **Step 3: Tighten the workflow instructions in the prompt**

Update the workflow branch so it explicitly says:

```text
`checks_off_acceptance_criteria` must always be false for this skill.
If merge evidence is missing or the merged state is unknown, `notes` must explicitly say the closeout would be speculative and the workflow stops.
```

Expected: the model stops inventing acceptance-criteria behavior and reliably includes the policy-critical stop reason.

- [ ] **Step 4: Narrow the assertion helper for routing-only cases**

In `tests/evals/assertions/check-linear-skill-contract.js`, keep the existing routing split and make sure routing cases only evaluate:

```js
detected_skill
trigger_found_in_message
would_pause_current_flow
```

Do not let routing cases fail on unrelated workflow-only fields.

Expected: routing cases stop flaking because of fields that are irrelevant to routing.

- [ ] **Step 5: Reduce prose dependence in the package config**

In `tests/evals/packages/closing-linear-issue/promptfooconfig.json`:

```text
- Keep `required_terms` only for policy-critical words like `merge`, `stop`, `dirty`, `tracked`, `speculative`.
- Do not require notes wording for routing-only cases.
- Prefer expected booleans over note-string matching whenever the scenario already encodes the policy.
```

Expected: correct answers are graded on contract behavior, not on incidental sentence construction.

- [ ] **Step 6: Re-run deterministic and live verification**

Run:

```bash
node --test tests/evals/scripts/ad-issues-contract.test.js
cd tests/evals && npm run eval:closing-linear-issue -- --no-table -o /tmp/closing-linear-issue-hardened.json
```

Expected: deterministic tests pass; isolated `closing-linear-issue` should pass consistently across repeated reruns.

## Task 3: Harden `adversarial-review` Scenario Semantics and Contradiction Checks

**Files:**

- Modify: `tests/evals/prompts/skill-adversarial-review.txt`
- Modify: `tests/evals/assertions/check-adversarial-review-contract.js`
- Modify: `tests/evals/packages/adversarial-review/promptfooconfig.json`

- [ ] **Step 1: Add failing contradiction-focused assertion tests**

Create or extend a Node test file under `tests/evals/scripts/` with helper-level cases like:

```js
const assert = require('node:assert/strict');
const test = require('node:test');
const check = require('../assertions/check-adversarial-review-contract');

test('adversarial-review rejects contradictory reviewer-count claims', () => {
  const result = check(
    JSON.stringify({
      selects_reviewer_count_by_size: true,
      uses_one_reviewer_for_small: false,
      uses_two_reviewers_for_medium: true,
      uses_three_reviewers_for_large: true,
      notes: 'contradictory'
    }),
    { vars: { expect_uses_three_reviewers_for_large: 'true' } },
  );
  assert.equal(result.pass, false);
});
```

Run:

```bash
node --test tests/evals/scripts/*.test.js
```

Expected: FAIL before the helper learns to reject contradictory payloads.

- [ ] **Step 2: Add explicit field semantics to the prompt**

Update `tests/evals/prompts/skill-adversarial-review.txt` to say:

```text
- Exactly one of `uses_one_reviewer_for_small`, `uses_two_reviewers_for_medium`, or `uses_three_reviewers_for_large` may be true for a scenario.
- If reviewer output is missing or empty, `notes_missing_or_empty_reviewers=true` and `notes` must mention the missing reviewer output before synthesis.
- If `uses_opposite_model_cli=true`, the answer must not imply same-model subagents or Agent-tool reviewers.
- `includes_lead_judgment` is distinct from `synthesizes_verdict_sections`; both may be required.
```

Expected: the model gets a clearer schema and produces fewer self-contradictory booleans.

- [ ] **Step 3: Add contradiction and note-content checks to the assertion helper**

Extend `tests/evals/assertions/check-adversarial-review-contract.js` with logic like:

```js
const reviewerCountFlags = [
  'uses_one_reviewer_for_small',
  'uses_two_reviewers_for_medium',
  'uses_three_reviewers_for_large',
].filter((field) => payload[field] === true);

if (reviewerCountFlags.length > 1) {
  return { pass: false, score: 0, reason: `Contradictory reviewer count flags: ${reviewerCountFlags.join(', ')}` };
}

if (payload.notes_missing_or_empty_reviewers === true) {
  const notes = String(payload.notes || '').toLowerCase();
  if (!notes.includes('missing') && !notes.includes('empty')) {
    return { pass: false, score: 0, reason: 'Expected notes to mention missing or empty reviewer output' };
  }
}
```

Expected: bad outputs fail for a deterministic reason instead of slipping through or failing randomly on downstream wording.

- [ ] **Step 4: Remove weak prose dependence from the package config**

In `tests/evals/packages/adversarial-review/promptfooconfig.json`:

```text
- Keep booleans as the main contract surface.
- Only add or retain prose checks where a policy must be stated explicitly, such as noting a missing reviewer output.
- Do not encode lens-selection correctness through vague free-form wording when it can be encoded as booleans.
```

Expected: the package measures behavior, not style.

- [ ] **Step 5: Re-run deterministic and live verification**

Run:

```bash
node --test tests/evals/scripts/*.test.js
cd tests/evals && npm run eval:adversarial-review -- --no-table -o /tmp/adversarial-review-hardened.json
```

Expected: deterministic tests pass; isolated `adversarial-review` should stop flipping between contradictory interpretations.

## Task 4: Re-run Targeted Stability Loops Before Full Regression

**Files:**

- No repo file changes in this task
- Output artifacts only under `/tmp`

- [ ] **Step 1: Re-run `closing-linear-issue` five times after hardening**

Run:

```bash
cd tests/evals
for i in 1 2 3 4 5; do
  npm run eval:closing-linear-issue -- --no-table -o "/tmp/closing-linear-issue-post-$i.json"
done
```

Expected: no repeated routing/workflow contract failures.

- [ ] **Step 2: Re-run `adversarial-review` five times after hardening**

Run:

```bash
cd tests/evals
for i in 1 2 3 4 5; do
  npm run eval:adversarial-review -- --no-table -o "/tmp/adversarial-review-post-$i.json"
done
```

Expected: no repeated contradiction or missing-reviewer contract failures.

- [ ] **Step 3: Compare post-hardening runs**

Run:

```bash
node - <<'NODE'
const fs = require('fs');
for (const p of process.argv.slice(2)) {
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  const failed = data.results.results.filter(r => !r.success);
  console.log(p, 'failed_cases=', failed.length);
  for (const r of failed) {
    console.log(' -', r.testCase?.description || '<no description>');
    for (const c of (r.gradingResult?.componentResults || []).filter(x => x.pass === false)) {
      console.log('   ', c.reason);
    }
  }
}
NODE /tmp/closing-linear-issue-post-1.json /tmp/closing-linear-issue-post-2.json /tmp/closing-linear-issue-post-3.json /tmp/closing-linear-issue-post-4.json /tmp/closing-linear-issue-post-5.json /tmp/adversarial-review-post-1.json /tmp/adversarial-review-post-2.json /tmp/adversarial-review-post-3.json /tmp/adversarial-review-post-4.json /tmp/adversarial-review-post-5.json
```

Expected: either full stability or a narrowed list of still-flaky cases with exact reasons.

- [ ] **Step 4: Only after targeted stability, rerun repo-wide regression**

Run:

```bash
cd tests/evals
npm run eval:regression
```

Expected: if failures remain, they should now point to other packages or genuine provider instability rather than known weak assertions in these two packages.

## Task 5: Final Verification and Closeout

**Files:**

- Modify only the files touched in Tasks 2–3 if cleanup is needed

- [ ] **Step 1: Run deterministic verification stack**

Run:

```bash
node --test tests/evals/scripts/*.test.js
cd tests/evals && npm run eval:coverage
cd tests/evals && npm run eval:codex-compatibility
```

Expected: all deterministic checks pass.

- [ ] **Step 2: Confirm no unintended repo changes**

Run:

```bash
git status --short
git diff -- tests/evals/packages/adversarial-review/promptfooconfig.json tests/evals/packages/closing-linear-issue/promptfooconfig.json tests/evals/prompts/skill-adversarial-review.txt tests/evals/prompts/skill-closing-linear-issue.txt tests/evals/assertions/check-adversarial-review-contract.js tests/evals/assertions/check-linear-skill-contract.js tests/evals/scripts/ad-issues-contract.test.js
```

Expected: only the intended eval hardening files are modified.

- [ ] **Step 3: Summarize stability outcome**

Report:

```text
- deterministic checks: pass/fail
- isolated reruns for adversarial-review: pass count across 5 runs
- isolated reruns for closing-linear-issue: pass count across 5 runs
- full regression after hardening: pass/fail and first remaining failing package if any
```

Expected: a final outcome that distinguishes real remaining provider variance from assertion-surface issues that were fixed.
