# Engineering Skills E2E Skill Extraction Cleanup Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the four e2e harness skills and their eval ownership from `engineering-skills` after the standalone `e2e-test-harness` plugin repo is working and registered in the marketplace.

**Architecture:** This is a cleanup-only pass. Delete the e2e skill directories and their eval packages/prompts/assertions, then update manifests and repo guidance so `engineering-skills` no longer claims ownership of harness-facing workflows.

**Tech Stack:** Markdown, JSON plugin manifests, npm, Promptfoo repo scripts, repo-map maintenance.

---

### Task 1: Confirm the new owner repo is live before deleting anything

**Files:**
- Verify only

- [ ] **Step 1: Confirm `e2e-test-harness` now owns the plugin**

Before cleanup, verify all of the following in `/Users/hbanerjee/src/e2e-test-harness`:

- `.claude-plugin/plugin.json` exists
- `.codex-plugin/plugin.json` exists
- the four e2e skill directories exist there
- `tests/evals/` has the shared harness shape
- migrated e2e skill eval smoke passes

- [ ] **Step 2: Confirm marketplace registration exists**

Before cleanup, verify in `/Users/hbanerjee/src/plugin-marketplace` that:

- `.claude-plugin/marketplace.json` contains `e2e-test-harness`
- `.agents/plugins/marketplace.json` contains `e2e-test-harness`
- `python3 scripts/validate-marketplace.py` passes

### Task 2: Remove the four e2e skill directories from `engineering-skills`

**Files:**
- Delete: `skills/e2e-adding-scenario/`
- Delete: `skills/e2e-authoring-feature-file/`
- Delete: `skills/e2e-extending-step-vocabulary/`
- Delete: `skills/e2e-regenerating-from-guide/`

- [ ] **Step 1: Delete `e2e-adding-scenario`**
- [ ] **Step 2: Delete `e2e-authoring-feature-file`**
- [ ] **Step 3: Delete `e2e-extending-step-vocabulary`**
- [ ] **Step 4: Delete `e2e-regenerating-from-guide`**

- [ ] **Step 5: Verify no skill directories remain**

Run:

```bash
cd /Users/hbanerjee/src/engineering-skills
rg --files skills | rg "e2e-(adding-scenario|authoring-feature-file|extending-step-vocabulary|regenerating-from-guide)"
```

Expected:

- no results

### Task 3: Remove the e2e eval ownership from `engineering-skills`

**Files:**
- Delete: `tests/evals/packages/e2e-adding-scenario/`
- Delete: `tests/evals/packages/e2e-authoring-feature-file/`
- Delete: `tests/evals/packages/e2e-extending-step-vocabulary/`
- Delete: `tests/evals/packages/e2e-regenerating-from-guide/`
- Delete: `tests/evals/prompts/skill-e2e-adding-scenario.txt`
- Delete: `tests/evals/prompts/skill-e2e-authoring-feature-file.txt`
- Delete: `tests/evals/prompts/skill-e2e-extending-step-vocabulary.txt`
- Delete: `tests/evals/prompts/skill-e2e-regenerating-from-guide.txt`
- Modify or delete: `tests/evals/assertions/check-e2e-bdd-skills-contract.js`

- [ ] **Step 1: Delete the four package directories**
- [ ] **Step 2: Delete the four prompt files**
- [ ] **Step 3: Remove `check-e2e-bdd-skills-contract.js` if nothing else imports it**

- [ ] **Step 4: Verify no e2e eval files remain**

Run:

```bash
cd /Users/hbanerjee/src/engineering-skills
rg -n "e2e-adding-scenario|e2e-authoring-feature-file|e2e-extending-step-vocabulary|e2e-regenerating-from-guide" tests/evals
```

Expected:

- no remaining package or prompt ownership references

### Task 4: Update repo guidance and inventory in `engineering-skills`

**Files:**
- Modify: `AGENTS.md`
- Modify: `repo-map.json`
- Modify: `README.md` if it lists the removed skills

- [ ] **Step 1: Remove the four skills from `AGENTS.md`**

Delete the four e2e skill bullets from the repo-local skills list.

- [ ] **Step 2: Update `repo-map.json`**

Remove the e2e skills from:

- skill-count description
- eval-harness coverage description
- command inventory if any e2e-specific eval commands are listed

- [ ] **Step 3: Update README or docs if they still claim e2e ownership**

Search for stale ownership text and replace it with the new boundary: these workflows now live in `e2e-test-harness`.

### Task 5: Bump manifests and verify the repo after removal

**Files:**
- Modify: `.claude-plugin/plugin.json`
- Modify: `.codex-plugin/plugin.json`
- Modify: `/Users/hbanerjee/src/plugin-marketplace/.claude-plugin/marketplace.json`
- Modify: `/Users/hbanerjee/src/plugin-marketplace/.agents/plugins/marketplace.json` if the `engineering-skills` entry description/category needs to change

- [ ] **Step 1: Bump plugin versions in lockstep**

Increase both manifest versions together because plugin content changed.

- [ ] **Step 2: Update marketplace entry text for `engineering-skills` if needed**

If the `engineering-skills` marketplace entry description still implies ownership of the e2e harness skills, update it to reflect the narrower post-extraction scope.

At minimum, review:

- `/Users/hbanerjee/src/plugin-marketplace/.claude-plugin/marketplace.json`
- `/Users/hbanerjee/src/plugin-marketplace/.agents/plugins/marketplace.json`

Expected:

- `engineering-skills` no longer reads like the owner of harness-facing e2e workflows

- [ ] **Step 3: Bump marketplace metadata version**

If either marketplace file changes during cleanup, bump:

```json
"/Users/hbanerjee/src/plugin-marketplace/.claude-plugin/marketplace.json.metadata.version"
```

This is required because the marketplace registry content changed.

- [ ] **Step 4: Run manifest validation**

Run:

```bash
cd /Users/hbanerjee/src/engineering-skills
npm run validate:plugin-manifests
```

Expected:

- pass

- [ ] **Step 5: Validate the marketplace repo if marketplace files changed**

Run:

```bash
cd /Users/hbanerjee/src/plugin-marketplace
python3 scripts/validate-marketplace.py
```

Expected:

- pass
- registry version bump and entry text changes are accepted

- [ ] **Step 6: Run deterministic eval checks still required by this repo**

Run:

```bash
cd /Users/hbanerjee/src/engineering-skills
npm run eval:coverage
npm run eval:codex-compatibility
```

Expected:

- pass with the e2e skills removed from local ownership

### Task 6: Final cleanup verification

**Files:**
- Verify all prior edits

- [ ] **Step 1: Confirm no stale ownership references remain**

Run:

```bash
cd /Users/hbanerjee/src/engineering-skills
rg -n "e2e-adding-scenario|e2e-authoring-feature-file|e2e-extending-step-vocabulary|e2e-regenerating-from-guide|E2E_HARNESS_ROOT" AGENTS.md README.md repo-map.json skills tests/evals
```

Expected:

- no remaining first-party ownership references

- [ ] **Step 2: Confirm marketplace text and version are aligned**

If the cleanup changed marketplace files, verify:

```bash
cd /Users/hbanerjee/src/plugin-marketplace
rg -n "\"name\": \"engineering-skills\"|\"version\":" .claude-plugin/marketplace.json .agents/plugins/marketplace.json
```

Expected:

- the `engineering-skills` entry reflects the post-extraction scope
- the Claude marketplace metadata version was bumped

- [ ] **Step 3: Commit cleanup in focused slices**

Use commit boundaries such as:

```text
refactor(skills): remove e2e harness skills from engineering-skills
refactor(evals): remove e2e skill eval ownership from engineering-skills
chore(plugin): update engineering-skills manifests and repo guidance after e2e extraction
chore(marketplace): update engineering-skills marketplace metadata after e2e extraction
```
