# reviewing-github-pr Skill — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new `reviewing-github-pr` skill that reviews an existing GitHub PR end-to-end: create a temporary review worktree, gather PR and Linear/spec context, verify acceptance criteria, draft a GitHub PR review event, ask before posting it, and clean up afterward.

**Architecture:** Implement the skill as one primary `SKILL.md` plus focused reference files for PR resolution, context gathering, acceptance-criteria verification, review decisioning, posting, and cleanup. Drive the implementation with deterministic contract tests first, then add a promptfoo eval package that encodes the workflow obligations and stop conditions. Keep repo integration changes separate: manifests, package scripts, README, AGENTS, and repo-map updates should be a final slice after the skill and tests exist.

**Tech Stack:** Markdown skill files, Node.js `node:test` contract tests, Promptfoo package config plus JS assertion, root/test harness `package.json` script registration, plugin manifests, repo metadata docs.

---

## File Structure

| File | Responsibility |
|---|---|
| `skills/reviewing-github-pr/SKILL.md` | Main workflow, trigger, framing model, hard gates, and routing to references |
| `skills/reviewing-github-pr/references/pr-resolution.md` | PR lookup, temporary worktree creation, GitHub data collection, and cleanup trigger |
| `skills/reviewing-github-pr/references/context-gathering.md` | `PR Claim`, `Required Scope`, `Implemented Scope`, Linear/doc/spec gathering rules |
| `skills/reviewing-github-pr/references/ac-verification.md` | Linear and PR-body AC verification, evidence rules, checkoff rules, stop conditions |
| `skills/reviewing-github-pr/references/review-decision.md` | Code-review lens, simplification-review lens, verdict selection, close-vs-approve-vs-request-changes |
| `skills/reviewing-github-pr/references/github-review-posting.md` | Draft review structure, approval gate, GitHub review event posting |
| `skills/reviewing-github-pr/references/worktree-cleanup.md` | Temporary review worktree cleanup and failure reporting |
| `tests/evals/scripts/reviewing-github-pr-contract.test.js` | Deterministic contract tests for the skill and references |
| `tests/evals/prompts/skill-reviewing-github-pr.txt` | Promptfoo workflow-eval prompt |
| `tests/evals/assertions/check-reviewing-github-pr-contract.js` | Promptfoo assertion contract for booleans/required terms |
| `tests/evals/packages/reviewing-github-pr/promptfooconfig.json` | Promptfoo package with smoke and scenario coverage |
| `docs/design/reviewing-github-pr-skill-design.md` | Existing design source of truth |
| `docs/plan/2026-05-06-reviewing-github-pr-skill.md` | This plan |
| `AGENTS.md` | Skill list update |
| `README.md` | Layout/current-skills/evals update |
| `repo-map.json` | Skills count, eval package description, command registration update |
| `.claude-plugin/plugin.json` | Version bump |
| `.codex-plugin/plugin.json` | Version bump |
| `package.json` | Root eval script registration |
| `tests/evals/package.json` | Eval harness script registration |

---

## Task 1: TDD the deterministic skill contract

**Files:**

- Create: `tests/evals/scripts/reviewing-github-pr-contract.test.js`

- [ ] **Step 1: Write the failing contract test**

Add a new `node:test` file that asserts:

- `skills/reviewing-github-pr/SKILL.md` exists
- all six reference files exist
- `SKILL.md` names the skill `reviewing-github-pr`
- `SKILL.md` contains `PR Claim`, `Required Scope`, and `Implemented Scope`
- `SKILL.md` says unchecked PR-body task-list items are reviewed as acceptance criteria
- `SKILL.md` requires explicit user approval before posting a GitHub PR review event
- `SKILL.md` says the skill cleans up the temporary review worktree
- `context-gathering.md` distinguishes PR/body/code sources from Linear/doc/spec sources
- `ac-verification.md` says unproven ACs stop the approval path
- `review-decision.md` covers `APPROVE`, `REQUEST_CHANGES`, `COMMENT`, and close recommendation
- `github-review-posting.md` requires presenting the drafted review before posting
- `worktree-cleanup.md` requires removing the temporary worktree and reporting cleanup failures

- [ ] **Step 2: Run the new test and verify RED**

Run:

```bash
node --test tests/evals/scripts/reviewing-github-pr-contract.test.js
```

Expected: FAIL because the new skill files do not exist yet.

- [ ] **Step 3: Keep the failing output**

Do not create skill content until the failure proves the test is checking the intended contract.

---

## Task 2: Implement the skill and references to satisfy the contract

**Files:**

- Create: `skills/reviewing-github-pr/SKILL.md`
- Create: `skills/reviewing-github-pr/references/pr-resolution.md`
- Create: `skills/reviewing-github-pr/references/context-gathering.md`
- Create: `skills/reviewing-github-pr/references/ac-verification.md`
- Create: `skills/reviewing-github-pr/references/review-decision.md`
- Create: `skills/reviewing-github-pr/references/github-review-posting.md`
- Create: `skills/reviewing-github-pr/references/worktree-cleanup.md`

- [ ] **Step 1: Write minimal `SKILL.md` to pass the contract**

Include:

- frontmatter with `name: reviewing-github-pr`
- description focused on when to use it
- sections for trigger, scope, `PR Claim`, `Required Scope`, `Implemented Scope`
- workflow phases for resolution, context gathering, AC verification, review decision, draft/confirm/post, cleanup
- hard gates for open/unproven ACs and user approval before posting

- [ ] **Step 2: Write minimal reference files**

Each file should capture only the design-approved contract:

- `pr-resolution.md`: PR entry forms, temporary sibling worktree, GitHub info gathering
- `context-gathering.md`: PR body + code for claim, Linear/docs/specs for required scope, ask-on-ambiguity rule
- `ac-verification.md`: verify unchecked Linear and PR-body ACs from code first, then targeted tests; check off only when proven; stop otherwise
- `review-decision.md`: code review + simplification review + verdict rules
- `github-review-posting.md`: draft review structure, approval gate, real GitHub review event types
- `worktree-cleanup.md`: cleanup always runs, report exact failure path if removal fails

- [ ] **Step 3: Run the contract test and verify GREEN**

Run:

```bash
node --test tests/evals/scripts/reviewing-github-pr-contract.test.js
```

Expected: PASS.

- [ ] **Step 4: Refactor prose only after green**

Tighten wording, remove duplication, and keep behavior identical. Re-run the same test after refactoring.

---

## Task 3: TDD the promptfoo eval package and assertion surface

**Files:**

- Create: `tests/evals/prompts/skill-reviewing-github-pr.txt`
- Create: `tests/evals/assertions/check-reviewing-github-pr-contract.js`
- Create: `tests/evals/packages/reviewing-github-pr/promptfooconfig.json`

- [ ] **Step 1: Define failing/pressure scenarios first**

Design scenarios that pressure these obligations:

- PR-triggered routing, not Linear-triggered routing
- PR/body/code define `PR Claim`
- Linear/docs/specs define `Required Scope`
- uncertain related-spec mapping asks once
- unchecked Linear or PR-body ACs stop approval when unproven
- proven ACs can be checked off
- explicit approval required before posting GitHub review
- cleanup still happens after the review flow
- badly mis-scoped PR can recommend close

- [ ] **Step 2: Write the assertion contract**

Add a JS assertion file following existing eval patterns that:

- parses one JSON object
- checks expected booleans from `expect_*` vars
- enforces required terms in notes/output

- [ ] **Step 3: Write the prompt and package config**

Create:

- one prompt that instructs the model to emit a single JSON object
- one package config with `[smoke]` coverage plus a few realistic scenarios

- [ ] **Step 4: Register the new eval script and verify package presence**

Update later in Task 4, then run:

```bash
npm run eval:coverage
```

Expected: PASS with `reviewing-github-pr` included in the package summary.

---

## Task 4: Integrate the new skill into repo metadata

**Files:**

- Modify: `AGENTS.md`
- Modify: `README.md`
- Modify: `repo-map.json`
- Modify: `.claude-plugin/plugin.json`
- Modify: `.codex-plugin/plugin.json`
- Modify: `package.json`
- Modify: `tests/evals/package.json`

- [ ] **Step 1: Register the skill in repo guidance**

Update `AGENTS.md` and `README.md` so `reviewing-github-pr` appears in the skill inventory and current-skills table.

- [ ] **Step 2: Register eval commands**

Add `eval:reviewing-github-pr` to:

```json
package.json
tests/evals/package.json
```

Point both to `tests/evals/packages/reviewing-github-pr/promptfooconfig.json`.

- [ ] **Step 3: Update repo-map**

Update:

- skill count from 16 to 17
- eval harness description to mention `reviewing-github-pr`
- command list with `eval_reviewing_github_pr`

- [ ] **Step 4: Bump plugin manifests in lockstep**

Bump `.claude-plugin/plugin.json` and `.codex-plugin/plugin.json` together for the new skill addition.

---

## Task 5: Verify everything

**Files:**

- Verify only

- [ ] **Step 1: Run deterministic tests**

```bash
node --test tests/evals/scripts/reviewing-github-pr-contract.test.js
```

- [ ] **Step 2: Run repo metadata/eval registration checks**

```bash
npm run validate:plugin-manifests
npm run eval:coverage
npm run eval:codex-compatibility
```

- [ ] **Step 3: Lint touched markdown**

Run `markdownlint` on the new skill docs, references, design doc if edited, and this plan file.

- [ ] **Step 4: Check final worktree**

```bash
git status --short
```

Expected: only the intended new `reviewing-github-pr` files and repo-registration updates remain.

---

## Task Ownership for Subagents

Use disjoint write scopes:

- **Worker 1:** `skills/reviewing-github-pr/**`
- **Worker 2:** `tests/evals/scripts/reviewing-github-pr-contract.test.js`, `tests/evals/prompts/skill-reviewing-github-pr.txt`, `tests/evals/assertions/check-reviewing-github-pr-contract.js`, `tests/evals/packages/reviewing-github-pr/**`
- **Worker 3:** `AGENTS.md`, `README.md`, `repo-map.json`, `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`, `package.json`, `tests/evals/package.json`

The controller owns:

- sequencing TDD red/green boundaries
- any cross-slice fixups
- verification
- final integration review
