# maintaining-github-repos Reference Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `maintaining-github-repos` from an org-specific cleanup workflow into a prompt-driven GitHub management reference skill that covers both org-level and repo-level maintenance signals, plus repo, branch, and PR follow-up actions.

**Architecture:** Keep `skills/maintaining-github-repos/SKILL.md` as the single entrypoint, but slim it down into a routing/index document. Move the substantive guidance into focused reference files for org signals, repo-level branch signals, repo-level PR signals, repo-level actions, branch-level actions, and PR-level actions. Preserve `scripts/analyze_repos.py` as an optional helper for org-level cleanup candidate analysis. Update the Promptfoo contract so it validates prompt-driven guidance, repo-level metric coverage, and existing destructive-action safeguards.

**Tech Stack:** Markdown skill/reference docs, `gh` CLI command patterns, `git` command patterns, existing Python helper script `skills/maintaining-github-repos/scripts/analyze_repos.py`, Promptfoo eval package under `tests/evals/`.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `skills/maintaining-github-repos/SKILL.md` | Rewrite as the entrypoint and routing guide for org-level and repo-level GitHub maintenance questions |
| `skills/maintaining-github-repos/references/org-level-signals.md` | Document typical organization-wide repo hygiene signals, commands, and interpretation |
| `skills/maintaining-github-repos/references/repo-level-branch-signals.md` | Document branch inventory metrics, stale-branch checks, and related branch inspection patterns |
| `skills/maintaining-github-repos/references/repo-level-pr-signals.md` | Document PR backlog and pending-review checks, including 48-hour pending thresholds |
| `skills/maintaining-github-repos/references/repo-level-actions.md` | Document follow-up actions for repo archive/delete candidates |
| `skills/maintaining-github-repos/references/branch-level-actions.md` | Document safe branch cleanup follow-up actions |
| `skills/maintaining-github-repos/references/pr-level-actions.md` | Document PR follow-up actions and decision points |
| `tests/evals/prompts/skill-maintaining-github-repos.txt` | Update the eval prompt fixture so it describes the new knowledge-skill behavior |
| `tests/evals/packages/maintaining-github-repos/promptfooconfig.json` | Expand or revise test cases for org-level and repo-level routing behavior |
| `tests/evals/assertions/check-maintaining-github-repos-contract.js` | Validate the new response shape and required contract fields |
| `repo-map.json` | Update the skill description only if the new reference structure materially changes the repository map entry |

---

## Task 1: Rename and rewrite `SKILL.md` as an index skill

**Files:**

- Move to: `skills/maintaining-github-repos/SKILL.md`

- [ ] **Step 1: Replace the current description with trigger-based routing language**

Write frontmatter that still starts with `Use when...` and describes both
org-level and repo-level GitHub maintenance questions without summarizing a
fixed workflow.

- [ ] **Step 2: Replace the workflow sections with an overview and routing table**

Document:

- org-level questions
- repo-level branch questions
- repo-level PR questions
- cleanup follow-up questions

Include a table mapping user intent to the new reference files.

- [ ] **Step 3: Preserve safety guidance in top-level rules**

Retain and restate:

- repo archive/delete actions require preview and exact scope confirmation
- branch deletion requires exact candidate presentation first
- prompt-driven inspection questions do not require a forced sequence

- [ ] **Step 4: Reposition `analyze_repos.py` as an optional helper**

Keep the script path and its purpose in the skill, but remove any implication
that every use of the skill begins by running it.

---

## Task 2: Add org-level reference material

**Files:**

- Create: `skills/maintaining-github-repos/references/org-level-signals.md`

- [ ] **Step 1: Document the common organization-wide signals**

Cover:

- stale repositories
- empty or README-only repositories
- scratch or dev repositories
- archived repositories worth reevaluating
- unusually high branch counts
- long-idle open PR inventory on an org-wide basis

- [ ] **Step 2: Provide command patterns for each signal**

Use concrete `gh` command patterns and point to
`skills/maintaining-github-repos/scripts/analyze_repos.py` where it is the best
fit.

- [ ] **Step 3: Add interpretation and next-step guidance**

For each signal, explain what it typically means and route the reader to
`repo-level-actions.md` when the next step is repo cleanup.

---

## Task 3: Add repo-level branch signal reference

**Files:**

- Create: `skills/maintaining-github-repos/references/repo-level-branch-signals.md`

- [ ] **Step 1: Add the required branch metrics**

Document how to inspect:

1. total branch count
2. merged branches vs remaining branches
3. branches with no commits for more than 5 days

- [ ] **Step 2: Add command patterns**

Include `gh` and `git` command examples that let an agent answer those metrics
from a local checkout or by GitHub CLI.

- [ ] **Step 3: Add recommended adjacent checks**

Cover:

- merged PR but branch still present
- no upstream or gone upstream
- no PR attached to the branch
- unusually old long-lived branches

- [ ] **Step 4: Route cleanup decisions to `branch-level-actions.md`**

Make the branch reference diagnostic, not procedural.

---

## Task 4: Add repo-level PR signal reference

**Files:**

- Create: `skills/maintaining-github-repos/references/repo-level-pr-signals.md`

- [ ] **Step 1: Add the required PR metric**

Document how to find PRs pending for more than 48 hours.

- [ ] **Step 2: Add adjacent PR health checks**

Cover:

- waiting on review
- approved but not merged
- failing required checks for extended periods
- stale draft PRs
- missing reviewer or assignee

- [ ] **Step 3: Add command patterns and interpretation**

Use `gh pr list`, `gh pr view`, and related filtering/query patterns. Explain
the difference between "old PR" and "actionable stale PR".

- [ ] **Step 4: Route follow-up decisions to `pr-level-actions.md`**

Keep this reference diagnostic.

---

## Task 5: Add action references split by repo, branch, and PR level

**Files:**

- Create: `skills/maintaining-github-repos/references/repo-level-actions.md`
- Create: `skills/maintaining-github-repos/references/branch-level-actions.md`
- Create: `skills/maintaining-github-repos/references/pr-level-actions.md`

- [ ] **Step 1: Write repo-level actions**

Document:

- what to do for archive candidates
- what to do for delete candidates
- when to preview with `analyze_repos.py --dry-run`
- when to stop for exact-scope confirmation

- [ ] **Step 2: Write branch-level actions**

Document:

- how to confirm merged branch candidates
- how to handle stale unmerged branches
- how to distinguish local cleanup from remote cleanup
- how to present the exact deletion set before acting

- [ ] **Step 3: Write PR-level actions**

Document:

- when to nudge reviewers
- when to ask the author to rebase
- when to close or convert to draft
- when a pending PR should block branch cleanup

---

## Task 6: Update the eval prompt and package

**Files:**

- Move to: `tests/evals/prompts/skill-maintaining-github-repos.txt`
- Move to: `tests/evals/packages/maintaining-github-repos/promptfooconfig.json`

- [ ] **Step 1: Rewrite the prompt fixture**

The prompt should describe the skill as a GitHub management reference skill
that can answer org-level or repo-level maintenance questions from prompts.

- [ ] **Step 2: Add repo-level branch and PR cases**

Add tests for:

- branch count and merged-vs-remaining reporting
- stale branch reporting using the `> 5 days` threshold
- PR backlog reporting using the `> 48 hours` threshold

- [ ] **Step 3: Preserve org-level cleanup coverage**

Keep at least one test that checks preview-before-execute and exact-scope
confirmation for repo archive/delete actions.

---

## Task 7: Update the maintaining-github-repos contract assertion

**Files:**

- Move to: `tests/evals/assertions/check-maintaining-github-repos-contract.js`

- [ ] **Step 1: Expand the contract fields**

Add checks for:

- repo-level routing support
- branch metric coverage
- PR metric coverage
- prompt-driven guidance support

- [ ] **Step 2: Keep the destructive-action safeguards**

Retain assertion coverage for:

- repo-local script awareness
- dry-run before destructive repo execution
- exact-scope confirmation
- stopping on unsupported partial destructive approval

---

## Task 8: Update repository metadata only if needed

**Files:**

- Modify: `repo-map.json`

- [ ] **Step 1: Review the current `maintaining-github-repos` entry**

Check whether the existing description is now stale because the skill is no
longer org-cleanup-only.

- [ ] **Step 2: Update only the durable description**

If stale, revise the description so it reflects the broader GitHub management
scope without embedding volatile file inventory.

---

## Task 9: Verify the documentation and eval contract changes

**Files:**

- Test: `skills/maintaining-github-repos/SKILL.md`
- Test: `skills/maintaining-github-repos/references/*.md`
- Test: `tests/evals/prompts/skill-maintaining-github-repos.txt`
- Test: `tests/evals/packages/maintaining-github-repos/promptfooconfig.json`
- Test: `tests/evals/assertions/check-maintaining-github-repos-contract.js`

- [ ] **Step 1: Run markdown lint on the new and modified Markdown files**

Run:

```bash
markdownlint skills/maintaining-github-repos/SKILL.md \
  skills/maintaining-github-repos/references/*.md \
  docs/design/maintaining-github-repos-reference-skill.md \
  docs/plan/2026-05-06-maintaining-github-repos-reference-skill.md
```

Expected: no lint errors.

- [ ] **Step 2: Run the targeted eval package**

Run:

```bash
npm run eval:maintaining-github-repos
```

Expected: the maintaining-github-repos eval package passes with the updated
knowledge-skill contract.

- [ ] **Step 3: Run repository-wide deterministic eval checks**

Run:

```bash
npm run eval:coverage
npm run eval:codex-compatibility
```

Expected: both commands exit zero.

---

## Self-Review

Spec coverage:

- The plan covers rewriting the skill, adding the six reference files, updating
  the eval prompt/package/assertion, and touching `repo-map.json` only if the
  durable description becomes stale.

Placeholder scan:

- No `TODO`, `TBD`, or vague "handle appropriately" placeholders remain.

Type consistency:

- File names, thresholds, and required metrics match the approved design:
  repo-level branch metrics include `> 5 days` inactivity, and PR metrics
  include `> 48 hours` pending age.
