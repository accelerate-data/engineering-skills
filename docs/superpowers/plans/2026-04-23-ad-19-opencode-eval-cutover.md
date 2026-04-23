# AD-19 OpenCode Eval Cutover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove that this repository's Promptfoo skill evals can run through `opencode:sdk` with equivalent contract coverage, starting with one representative suite and expanding only after manual validation.

**Architecture:** Execute the migration in three phases. Phase 1 ports one representative eval suite plus the shared harness dependencies and gets automated checks green. Phase 2 manually validates the exact OpenCode setup and documents what worked. Phase 3 ports the remaining suites using the same pattern with minimal drift.

**Tech Stack:** Markdown, YAML, JSON, shell, Promptfoo, OpenCode SDK, npm

---

## File Map

| File | Action | Phase | Responsibility |
|---|---|---|---|
| `tests/evals/package.json` | Modify | 1 | Replace Anthropic SDK deps with OpenCode SDK deps; keep scripts stable |
| `tests/evals/package-lock.json` | Modify | 1 | Lock the new eval harness dependency graph after `npm install` |
| `tests/evals/scripts/promptfoo.sh` | Inspect, modify only if needed | 1 | Keep repo-local Promptfoo state and env bootstrap stable |
| `tests/evals/packages/creating-linear-issue/skill-creating-linear-issue.yaml` | Modify | 1 | POC provider migration to `opencode:sdk` |
| `tests/evals/prompts/skill-creating-linear-issue.txt` | Inspect, modify if needed | 1 | Keep POC prompt provider-neutral |
| `tests/evals/assertions/check-linear-skill-contract.js` | Inspect, modify if needed | 1 | Keep POC contract strict while removing provider-specific assumptions only if necessary |
| `README.md` | Modify | 2 | Document the validated OpenCode setup and targeted POC command |
| `repo-map.json` | Modify only if stale | 2 or 3 | Refresh eval harness notes only when the documented setup or command surface materially changes |
| `tests/evals/packages/creating-linear-issue/skill-creating-linear-issue-routing.yaml` | Modify | 3 | Port provider config using the proven Phase 1 pattern |
| `tests/evals/packages/implementing-linear-issue/skill-implementing-linear-issue.yaml` | Modify | 3 | Port provider config using the proven Phase 1 pattern |
| `tests/evals/packages/raising-linear-pr/skill-raising-linear-pr.yaml` | Modify | 3 | Port provider config using the proven Phase 1 pattern |
| `tests/evals/packages/closing-linear-issue/skill-closing-linear-issue.yaml` | Modify | 3 | Port provider config using the proven Phase 1 pattern |
| `tests/evals/packages/maintain-github-repos/skill-maintain-github-repos.yaml` | Modify | 3 | Port provider config using the proven Phase 1 pattern |
| `tests/evals/packages/create-feature-request/skill-create-feature-request.yaml` | Modify | 3 | Port provider config using the proven Phase 1 pattern |
| `tests/evals/packages/writing-tests/skill-writing-tests.yaml` | Modify | 3 | Port provider config using the proven Phase 1 pattern |
| `tests/evals/prompts/skill-creating-linear-issue-routing.txt` | Inspect, modify if needed | 3 | Keep prompt provider-neutral |
| `tests/evals/prompts/skill-implementing-linear-issue.txt` | Inspect, modify if needed | 3 | Keep prompt provider-neutral |
| `tests/evals/prompts/skill-raising-linear-pr.txt` | Inspect, modify if needed | 3 | Keep prompt provider-neutral |
| `tests/evals/prompts/skill-closing-linear-issue.txt` | Inspect, modify if needed | 3 | Keep prompt provider-neutral |
| `tests/evals/prompts/skill-maintain-github-repos.txt` | Inspect, modify if needed | 3 | Keep prompt provider-neutral |
| `tests/evals/prompts/skill-create-feature-request.txt` | Inspect, modify if needed | 3 | Keep prompt provider-neutral |
| `tests/evals/prompts/skill-writing-tests.txt` | Inspect, modify if needed | 3 | Keep prompt provider-neutral |
| `tests/evals/assertions/check-routing-contract.js` | Inspect, modify if needed | 3 | Repair only provider-coupled assumptions exposed by the patterned rollout |
| `tests/evals/assertions/check-create-feature-request-contract.js` | Inspect, modify if needed | 3 | Same for feature-request contract |
| `tests/evals/assertions/check-maintain-github-repos-contract.js` | Inspect, modify if needed | 3 | Same for repo-maintenance contract |
| `tests/evals/assertions/check-writing-tests-contract.js` | Inspect, modify if needed | 3 | Same for writing-tests contract |

## Phase 1 Provider Template

Use one repo-standard OpenCode provider shape for the POC suite:

```yaml
providers:
  - id: opencode:sdk
    config:
      provider_id: opencode
      model: qwen3.6-plus
      working_dir: ../..
      max_turns: 20
      tools:
        read: true
        grep: true
        glob: true
        list: true
        bash: true
      permission:
        bash: allow
        doom_loop: deny
        external_directory: deny
```

Phase 1 rules:

- `read`, `grep`, `glob`, `list`, and `bash` are the only enabled tools.
- `edit` and `write` stay disabled during the POC.
- `opencode` is the provider under test and the intended direct provider path unless Phase 2 manual validation disproves it.
- Do not touch any non-POC suite YAML in Phase 1.

## Phase 1: POC + Automated Validation

### Task 1: Prepare the worktree and harness for one-suite testing

**Files:**

- Modify: `tests/evals/package.json`
- Modify: `tests/evals/package-lock.json`
- Inspect: `tests/evals/scripts/promptfoo.sh`

- [ ] **Step 1: Create the AD-19 worktree before editing**

Run:

```bash
./scripts/worktree.sh feature/ad-19-cut-over-repo-evals-from-claude-agent-sdk-to-opencode-sdk
```

Expected:

- A sibling worktree appears at `../worktrees/feature/ad-19-cut-over-repo-evals-from-claude-agent-sdk-to-opencode-sdk`
- `.env` and `tests/evals/.promptfoo` are symlinked into the worktree

- [ ] **Step 2: Replace Anthropic eval harness packages with OpenCode SDK**

In `tests/evals/package.json`, replace the eval-harness dependencies block with:

```json
"dependencies": {
  "@opencode-ai/sdk": "1.14.21",
  "promptfoo": "0.121.7"
}
```

Delete the Anthropic-specific `overrides` block unless another remaining dependency still requires it.

- [ ] **Step 3: Refresh the lockfile from the eval harness directory**

Run:

```bash
cd ../worktrees/feature/ad-19-cut-over-repo-evals-from-claude-agent-sdk-to-opencode-sdk/tests/evals
npm install
```

Expected:

- `package-lock.json` drops `@anthropic-ai/claude-agent-sdk` and `@anthropic-ai/claude-code`
- `package-lock.json` includes `@opencode-ai/sdk`

- [ ] **Step 4: Verify the Promptfoo wrapper still works unchanged**

Check that `tests/evals/scripts/promptfoo.sh` still only needs to:

- set repo-local Promptfoo config/cache directories
- load repo-root `.env`
- execute Promptfoo's entrypoint

Do not add provider-specific shell logic unless OpenCode startup fails without it. The wrapper must export `PROMPTFOO_CONFIG_DIR` so eval runs persist to the repo-owned `tests/evals/.promptfoo/promptfoo.db` instead of falling back to `~/.promptfoo`.

- [ ] **Step 5: Commit the Phase 1 harness change**

Run:

```bash
git add tests/evals/package.json tests/evals/package-lock.json tests/evals/scripts/promptfoo.sh
git commit -m "chore: add opencode sdk support for eval harness"
```

### Task 2: Port the representative POC suite

**Files:**

- Modify: `tests/evals/packages/creating-linear-issue/skill-creating-linear-issue.yaml`
- Inspect: `tests/evals/prompts/skill-creating-linear-issue.txt`
- Inspect: `tests/evals/assertions/check-linear-skill-contract.js`

- [ ] **Step 1: Replace the provider only in the POC suite**

In `tests/evals/packages/creating-linear-issue/skill-creating-linear-issue.yaml`, replace:

```yaml
providers:
  - id: anthropic:claude-agent-sdk
    config:
      model: claude-haiku-4-5-20251001
      working_dir: ../..
      max_turns: 20
      permission_mode: auto
      append_allowed_tools:
        - Read
        - Bash
        - Glob
        - Grep
```

with:

```yaml
providers:
  - id: opencode:sdk
    config:
      provider_id: opencode
      model: qwen3.6-plus
      working_dir: ../..
      max_turns: 20
      tools:
        read: true
        grep: true
        glob: true
        list: true
        bash: true
      permission:
        bash: allow
        doom_loop: deny
        external_directory: deny
```

- [ ] **Step 2: Run the POC suite and capture the first failure mode**

Run:

```bash
cd tests/evals
npm run eval:creating-linear-issue
```

Expected:

- Promptfoo starts an OpenCode-backed session instead of invoking Claude Agent SDK
- If the suite fails, the failure should be about contract drift or auth/runtime setup, not missing provider plumbing

- [ ] **Step 3: Repair only provider-coupled prompt or assertion assumptions**

Audit:

- `tests/evals/prompts/skill-creating-linear-issue.txt`
- `tests/evals/assertions/check-linear-skill-contract.js`

Allowed changes:

- remove assumptions about tool capitalization or provider-specific narration
- keep behavior assertions intact: planning gate, project resolution, clarification order, and forbidden early issue creation

Do not broaden assertions just to make the POC pass.

- [ ] **Step 4: Re-run the POC suite until it passes cleanly**

Run:

```bash
cd tests/evals
npm run eval:creating-linear-issue
```

Expected:

- All tests in `skill-creating-linear-issue.yaml` pass under `opencode:sdk`

- [ ] **Step 5: Run deterministic checks to confirm the POC did not break repo discipline**

Run:

```bash
cd tests/evals
npm run eval:coverage
npm run eval:codex-compatibility
```

Expected:

- both deterministic checks pass

- [ ] **Step 6: Commit the Phase 1 POC**

Run:

```bash
git add tests/evals/packages/creating-linear-issue/skill-creating-linear-issue.yaml tests/evals/prompts/skill-creating-linear-issue.txt tests/evals/assertions/check-linear-skill-contract.js
git commit -m "test: port creating-linear-issue eval to opencode"
```

### Phase 1 Exit Criteria

Phase 1 is complete only if all of the following are true:

- `npm run eval:creating-linear-issue` passes
- `npm run eval:coverage` passes
- `npm run eval:codex-compatibility` passes
- OpenCode auth is stable enough that the passing run is repeatable
- no non-POC eval package YAML was modified

If any item fails, stop. Do not start Phase 2 or Phase 3.

## Phase 2: Manual Validation and Pattern Approval

### Task 3: Manually validate the Phase 1 setup

**Files:**

- Modify: `README.md`
- Modify: `repo-map.json` only if it becomes stale

- [ ] **Step 1: Manually rerun the POC flow with the intended credentials**

Run the same POC suite from a clean shell with the actual OpenCode configuration intended for daily use:

```bash
cd tests/evals
npm run eval:creating-linear-issue
```

Confirm manually:

- auth flow is straightforward
- runtime is acceptable
- tool access behaves as expected
- output quality is comparable to the current suite quality bar

- [ ] **Step 2: Record the validated setup in `README.md`**

Add a short eval prerequisite section that reflects what actually worked in Phase 1:

```bash
curl -fsSL https://opencode.ai/install | bash
cd tests/evals
npm install
```

Document:

- that the Phase 1 POC uses `opencode:sdk`
- that `provider_id: opencode` with `model: qwen3.6-plus` is the currently validated provider configuration
- the exact targeted command: `npm run eval:creating-linear-issue`

- [ ] **Step 3: Update `repo-map.json` only if the harness notes are stale**

If `repo-map.json` still accurately describes the eval harness after the POC, leave it unchanged.
If it implies Anthropic-only setup for eval execution, update only those lines.

- [ ] **Step 4: Commit the manual-validation docs**

Run:

```bash
git add README.md repo-map.json
git commit -m "docs: record validated opencode eval setup"
```

### Phase 2 Exit Criteria

Phase 2 is complete only if all of the following are true:

- a human manually reran the POC setup successfully
- the README documents the setup that was actually used
- the Phase 1 provider template is accepted as the migration pattern

If any item fails, stop. Revise Phase 1 before expanding.

## Phase 3: Roll Out the Same Pattern to the Remaining Suites

### Task 4: Port the remaining eval YAMLs using the Phase 1 pattern

**Files:**

- Modify: `tests/evals/packages/creating-linear-issue/skill-creating-linear-issue-routing.yaml`
- Modify: `tests/evals/packages/implementing-linear-issue/skill-implementing-linear-issue.yaml`
- Modify: `tests/evals/packages/raising-linear-pr/skill-raising-linear-pr.yaml`
- Modify: `tests/evals/packages/closing-linear-issue/skill-closing-linear-issue.yaml`
- Modify: `tests/evals/packages/maintain-github-repos/skill-maintain-github-repos.yaml`
- Modify: `tests/evals/packages/create-feature-request/skill-create-feature-request.yaml`
- Modify: `tests/evals/packages/writing-tests/skill-writing-tests.yaml`
- Inspect: `tests/evals/prompts/skill-creating-linear-issue-routing.txt`
- Inspect: `tests/evals/prompts/skill-implementing-linear-issue.txt`
- Inspect: `tests/evals/prompts/skill-raising-linear-pr.txt`
- Inspect: `tests/evals/prompts/skill-closing-linear-issue.txt`
- Inspect: `tests/evals/prompts/skill-maintain-github-repos.txt`
- Inspect: `tests/evals/prompts/skill-create-feature-request.txt`
- Inspect: `tests/evals/prompts/skill-writing-tests.txt`
- Inspect: `tests/evals/assertions/check-routing-contract.js`
- Inspect: `tests/evals/assertions/check-create-feature-request-contract.js`
- Inspect: `tests/evals/assertions/check-maintain-github-repos-contract.js`
- Inspect: `tests/evals/assertions/check-writing-tests-contract.js`
- Inspect: `tests/evals/assertions/check-linear-skill-contract.js`

- [ ] **Step 1: Replace `anthropic:claude-agent-sdk` in every remaining eval YAML**

Apply the exact Phase 1 provider template to the remaining YAML files. Keep:

- the existing prompt file path
- the existing default assertion file
- the existing test cases

Only vary the provider block if Phase 2 documented a justified difference.

- [ ] **Step 2: Run targeted suites one at a time**

Run:

```bash
cd tests/evals
npm run eval:creating-linear-issue-routing
npm run eval:implementing-linear-issue
npm run eval:raising-linear-pr
npm run eval:closing-linear-issue
npm run eval:maintain-github-repos
npm run eval:create-feature-request
npm run eval:writing-tests
```

Expected:

- failures, if any, should be concrete contract or prompt drift
- no suite should fail because the provider/tool plumbing is missing

- [ ] **Step 3: Fix prompt or assertion files only where the Phase 1 pattern exposes real provider coupling**

When editing prompts or assertions:

- keep wording provider-neutral
- normalize provider-specific output phrasing only when the behavioral contract is unchanged
- do not delete required-term, ordering, or gating assertions to mask poorer behavior

- [ ] **Step 4: Run the full eval matrix**

Run:

```bash
cd tests/evals
npm run eval
npm run eval:coverage
npm run eval:codex-compatibility
```

Expected:

- the full Promptfoo suite passes through OpenCode
- deterministic checks remain green

- [ ] **Step 5: Run repository quality checks**

Run:

```bash
npm run validate:plugin-manifests
git diff --check origin/main...HEAD
markdownlint README.md docs/superpowers/plans/2026-04-23-ad-19-opencode-eval-cutover.md
```

Expected:

- plugin-manifest validation passes
- no whitespace/errors in the diff
- markdownlint passes for changed docs

- [ ] **Step 6: Commit the rollout**

Run:

```bash
git add README.md repo-map.json tests/evals
git commit -m "test: cut over remaining evals to opencode"
```

## Risks To Watch

1. OpenCode tool naming is lowercase (`read`, `grep`, `glob`, `list`, `bash`) while some prompts or assertions may assume Claude-style capitalization.
2. Response style may drift without behavior drift; assertion edits must normalize wording, not relax the contract.
3. `bash: true` can introduce side effects. Keep `external_directory: deny`, avoid `edit`/`write`, and do not parallelize the rollout blindly if Promptfoo state becomes noisy.
4. Promptfoo must be pointed at the repo-owned config directory. If `PROMPTFOO_CONFIG_DIR` is not exported, cost and token persistence silently fall back to `~/.promptfoo` and the worktree symlinked `.promptfoo` is unused.

## Current Doc References

- Promptfoo OpenCode SDK provider docs: https://www.promptfoo.dev/docs/providers/opencode-sdk/
- OpenCode provider configuration docs: https://opencode.ai/docs/providers
