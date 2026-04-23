# AD-19 OpenCode Eval Cutover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the repository's Promptfoo `anthropic:claude-agent-sdk` eval provider usage with `opencode:sdk` so repo-owned skill evals no longer require Anthropic credentials as the default unit-test path.

**Architecture:** Migrate the eval harness in three layers. First, switch the harness dependencies and establish one repo-standard OpenCode provider template. Second, port each agentic eval package to that template while preserving the same assertions and prompt contracts. Third, update docs and verification so maintainers can run the full suite with OpenCode-backed credentials and no lingering Claude-Agent-SDK assumptions.

**Tech Stack:** Markdown, YAML, JSON, shell, Promptfoo, OpenCode SDK, npm

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `tests/evals/package.json` | Modify | Replace Anthropic SDK deps with OpenCode SDK deps; keep eval scripts stable |
| `tests/evals/package-lock.json` | Modify | Lock the new eval harness dependency graph after `npm install` |
| `tests/evals/scripts/promptfoo.sh` | Inspect, modify only if needed | Keep repo-local Promptfoo state; add env bootstrap only if OpenCode requires explicit repo-local config |
| `tests/evals/packages/creating-linear-issue/skill-creating-linear-issue.yaml` | Modify | Port provider config to `opencode:sdk` |
| `tests/evals/packages/creating-linear-issue/skill-creating-linear-issue-routing.yaml` | Modify | Port provider config to `opencode:sdk` |
| `tests/evals/packages/implementing-linear-issue/skill-implementing-linear-issue.yaml` | Modify | Port provider config to `opencode:sdk` |
| `tests/evals/packages/raising-linear-pr/skill-raising-linear-pr.yaml` | Modify | Port provider config to `opencode:sdk` |
| `tests/evals/packages/closing-linear-issue/skill-closing-linear-issue.yaml` | Modify | Port provider config to `opencode:sdk` |
| `tests/evals/packages/maintain-github-repos/skill-maintain-github-repos.yaml` | Modify | Port provider config to `opencode:sdk` |
| `tests/evals/packages/create-feature-request/skill-create-feature-request.yaml` | Modify | Port provider config to `opencode:sdk` |
| `tests/evals/packages/writing-tests/skill-writing-tests.yaml` | Modify | Port provider config to `opencode:sdk` |
| `tests/evals/prompts/skill-creating-linear-issue.txt` | Inspect, modify if needed | Keep prompt provider-neutral if OpenCode behaves differently around tool wording |
| `tests/evals/prompts/skill-creating-linear-issue-routing.txt` | Inspect, modify if needed | Same as above for routing eval |
| `tests/evals/prompts/skill-implementing-linear-issue.txt` | Inspect, modify if needed | Keep prompt provider-neutral |
| `tests/evals/prompts/skill-raising-linear-pr.txt` | Inspect, modify if needed | Keep prompt provider-neutral |
| `tests/evals/prompts/skill-closing-linear-issue.txt` | Inspect, modify if needed | Keep prompt provider-neutral |
| `tests/evals/prompts/skill-maintain-github-repos.txt` | Inspect, modify if needed | Keep prompt provider-neutral |
| `tests/evals/prompts/skill-create-feature-request.txt` | Inspect, modify if needed | Keep prompt provider-neutral |
| `tests/evals/prompts/skill-writing-tests.txt` | Inspect, modify if needed | Keep prompt provider-neutral |
| `tests/evals/assertions/check-linear-skill-contract.js` | Inspect, modify if needed | Relax only provider-specific output assumptions exposed by OpenCode |
| `tests/evals/assertions/check-routing-contract.js` | Inspect, modify if needed | Same for routing-only checks |
| `tests/evals/assertions/check-create-feature-request-contract.js` | Inspect, modify if needed | Same for feature-request contract |
| `tests/evals/assertions/check-maintain-github-repos-contract.js` | Inspect, modify if needed | Same for repo-maintenance contract |
| `tests/evals/assertions/check-writing-tests-contract.js` | Inspect, modify if needed | Same for writing-tests contract |
| `README.md` | Modify | Document OpenCode-based eval prerequisites and targeted suite commands |
| `repo-map.json` | Modify | Refresh eval harness description/commands only if structure or prerequisites wording becomes stale |

## Provider Template

All eight agentic Promptfoo packages should converge on one OpenCode provider shape, adjusted only when a suite truly needs different permissions:

```yaml
providers:
  - id: opencode:sdk
    config:
      provider_id: openrouter
      model: anthropic/claude-sonnet-4.5
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

Notes:

- This matches current suite needs: read/search plus shell access.
- `list` is included because OpenCode enables it naturally alongside working-directory file tools.
- `edit` and `write` stay disabled. These evals validate planning/review behavior, not file mutation.
- Promptfoo's current OpenCode docs describe `working_dir`, `tools`, `permission`, and `provider_id` exactly in this shape, and warn that write/edit/bash side effects should be kept serialized when enabled.

## Task 1: Establish the harness baseline and dependency cutover

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
  "@opencode-ai/sdk": "latest",
  "promptfoo": "latest"
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

Do not add provider-specific shell logic unless OpenCode startup fails without it.

- [ ] **Step 5: Commit the harness dependency switch**

Run:

```bash
git add tests/evals/package.json tests/evals/package-lock.json tests/evals/scripts/promptfoo.sh
git commit -m "chore: switch eval harness dependencies to opencode sdk"
```

## Task 2: Port one representative package and lock the provider template

**Files:**

- Modify: `tests/evals/packages/creating-linear-issue/skill-creating-linear-issue.yaml`
- Inspect: `tests/evals/prompts/skill-creating-linear-issue.txt`
- Inspect: `tests/evals/assertions/check-linear-skill-contract.js`

- [ ] **Step 1: Replace the provider in the representative suite**

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
      provider_id: openrouter
      model: anthropic/claude-sonnet-4.5
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

- [ ] **Step 2: Run only the representative eval and capture first-failure shape**

Run:

```bash
cd tests/evals
npm run eval:creating-linear-issue
```

Expected:

- Promptfoo starts an OpenCode-backed session instead of invoking Claude Agent SDK
- If the suite fails, the failure should now be about output contract mismatches, not missing provider plumbing

- [ ] **Step 3: Repair only provider-coupled prompt or assertion assumptions**

Audit:

- `tests/evals/prompts/skill-creating-linear-issue.txt`
- `tests/evals/assertions/check-linear-skill-contract.js`

Allowed changes:

- remove assumptions about tool capitalization or agent-specific narration
- keep behavior assertions intact: planning gate, project resolution, clarification order, and forbidden early issue creation

Do not broaden assertions just to make a weak model pass.

- [ ] **Step 4: Re-run the representative suite until it passes cleanly**

Run:

```bash
cd tests/evals
npm run eval:creating-linear-issue
```

Expected:

- All tests in `skill-creating-linear-issue.yaml` pass under `opencode:sdk`

- [ ] **Step 5: Commit the proven provider template**

Run:

```bash
git add tests/evals/packages/creating-linear-issue/skill-creating-linear-issue.yaml tests/evals/prompts/skill-creating-linear-issue.txt tests/evals/assertions/check-linear-skill-contract.js
git commit -m "test: port creating-linear-issue eval to opencode"
```

## Task 3: Migrate the remaining agentic eval packages in one consistency pass

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

- [ ] **Step 1: Replace `anthropic:claude-agent-sdk` in every remaining eval YAML**

For each YAML above, apply the same provider block proven in Task 2. Keep:

- the existing prompt file path
- the existing default assertion file
- the existing test cases

Only vary `max_turns` if a specific suite already had a different turn budget.

- [ ] **Step 2: Run the migrated suites one at a time and repair only concrete contract drift**

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

- failures, if any, should cluster around assertion wording or model-choice quality
- no suite should fail with missing OpenCode provider/tool configuration

- [ ] **Step 3: Fix prompt wording only where it is truly provider-coupled**

When editing prompt files, preserve the contract and keep wording neutral:

- prefer `Read the skill at ...` over naming a provider SDK
- do not refer to `Read`, `Bash`, `Glob`, or `Grep` by Claude-specific capitalization unless the prompt is explicitly testing tool names

- [ ] **Step 4: Commit the full YAML migration**

Run:

```bash
git add tests/evals/packages tests/evals/prompts
git commit -m "test: migrate agentic promptfoo suites to opencode"
```

## Task 4: Tighten shared assertions only where OpenCode changes observable output format

**Files:**

- Inspect, modify if needed: `tests/evals/assertions/check-routing-contract.js`
- Inspect, modify if needed: `tests/evals/assertions/check-create-feature-request-contract.js`
- Inspect, modify if needed: `tests/evals/assertions/check-maintain-github-repos-contract.js`
- Inspect, modify if needed: `tests/evals/assertions/check-writing-tests-contract.js`
- Inspect, modify if needed: `tests/evals/assertions/check-linear-skill-contract.js`

- [ ] **Step 1: Audit each assertion file for provider-name assumptions**

Search for checks that depend on:

- Anthropic/Claude naming
- exact tool names from Claude Agent SDK
- wrapper text that OpenCode may phrase differently while preserving behavior

Keep semantic checks unchanged.

- [ ] **Step 2: Make the smallest assertion changes needed**

Examples of acceptable changes:

```js
const mentionsFileRead = /read the skill/i.test(output);
const mentionsProviderSpecificTool = /\bRead\b/.test(output);

assert.ok(
  mentionsFileRead || mentionsProviderSpecificTool,
  'expected the response to instruct the agent to inspect the skill before answering'
);
```

Examples of unacceptable changes:

- deleting required-term checks because the new provider performs worse
- removing ordering/gating assertions that define the skill contract

- [ ] **Step 3: Run deterministic checks after every shared-assertion edit**

Run:

```bash
cd tests/evals
npm run eval:coverage
npm run eval:codex-compatibility
```

Expected:

- both checks pass after assertion updates

- [ ] **Step 4: Commit assertion repairs**

Run:

```bash
git add tests/evals/assertions tests/evals/scripts/check-skill-eval-coverage.js tests/evals/scripts/check-codex-compatibility.js
git commit -m "test: align shared eval assertions with opencode output"
```

## Task 5: Document the new default eval path

**Files:**

- Modify: `README.md`
- Modify: `repo-map.json` (only if command or harness metadata is stale after the cutover)

- [ ] **Step 1: Update README eval prerequisites**

In `README.md`, revise the Eval Harness section so it tells maintainers to:

- install `tests/evals` dependencies
- install/configure OpenCode
- provide OpenCode credentials via the chosen provider, with OpenRouter called out as the default cutover target

Add a short prerequisite block like:

```bash
curl -fsSL https://opencode.ai/install | bash
cd tests/evals
npm install
```

- [ ] **Step 2: Expand the targeted suite list so it reflects the real harness surface**

Ensure the README lists all current targeted scripts from `tests/evals/package.json`, including:

- `eval:creating-linear-issue-routing`
- `eval:create-feature-request`
- `eval:writing-tests`
- deterministic checks

- [ ] **Step 3: Update `repo-map.json` only if the harness description became stale**

If the repo map still accurately describes the eval harness after the provider cutover, leave it alone.
If it mentions Anthropic-specific assumptions, update only those lines.

- [ ] **Step 4: Commit the docs update**

Run:

```bash
git add README.md repo-map.json
git commit -m "docs: update eval setup for opencode cutover"
```

## Task 6: Run the full verification matrix and remove lingering Anthropic dependencies

**Files:**

- Final audit across:
  - `tests/evals/package.json`
  - `tests/evals/package-lock.json`
  - `tests/evals/packages/*.yaml`
  - `README.md`
  - `repo-map.json`

- [ ] **Step 1: Verify Anthropic eval provider references are gone from the migrated surface**

Run:

```bash
rg -n "anthropic:claude-agent-sdk|@anthropic-ai/claude-agent-sdk|@anthropic-ai/claude-code" tests/evals README.md repo-map.json
```

Expected:

- no matches in migrated eval config or docs
- any remaining Anthropic mentions should be unrelated product examples, not eval prerequisites

- [ ] **Step 2: Run the full repository eval matrix**

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

- [ ] **Step 3: Run repository quality checks from the repo root**

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

- [ ] **Step 4: Create the final implementation commit**

Run:

```bash
git add README.md repo-map.json tests/evals
git commit -m "test: cut over eval harness from claude agent sdk to opencode"
```

## Risks To Watch

1. OpenCode tool naming is lowercase (`read`, `grep`, `glob`, `list`, `bash`) while some current prompts/assertions may implicitly assume Claude-style capitalization.
2. Switching providers may change response style without changing behavior; assertion edits should normalize wording, not weaken the contract.
3. `bash: true` introduces side effects in OpenCode. Keep `external_directory: deny`, avoid `edit`/`write`, and run evals serially if Promptfoo side effects become visible.
4. OpenRouter model choice is a policy decision. If the repo later standardizes on a different OpenCode provider, keep that change centralized in the YAML provider blocks and README prerequisites rather than forking suite behavior.

## Current Doc References

- Promptfoo OpenCode SDK provider docs: https://www.promptfoo.dev/docs/providers/opencode-sdk/
- OpenCode provider configuration docs: https://opencode.ai/docs/providers
