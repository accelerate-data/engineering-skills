# maintaining-github-repos Reference Skill — Design Document

**Status:** Approved
**Date:** 2026-05-06
**Destination:** `engineering-skills` plugin

---

## Background

`maintaining-github-repos` currently behaves like a narrow workflow skill for
org-wide repository cleanup in the `accelerate-data` organization. That shape
does not fit the broader use case the user wants to support:

- org-level GitHub hygiene questions
- repo-level branch and PR hygiene questions
- prompt-driven retrieval of one or more checks without forcing a fixed
  execution order

The skill should become a knowledge skill. It should teach the agent what kinds
of GitHub maintenance signals commonly matter, how to inspect them, what
thresholds or heuristics are useful, and what follow-up actions are appropriate.
The user should be able to ask for any subset of checks from the prompt and have
the skill guide the response.

---

## Goal

Redesign `maintaining-github-repos` from a linear cleanup workflow into a general
GitHub management reference skill that covers both org-level and repo-level
maintenance signals, plus safe follow-up actions for repo, branch, and PR
cleanup candidates.

---

## Scope

In scope:

- GitHub maintenance guidance for one organization or one repository
- Org-level signals for repo inventory and cleanup candidates
- Repo-level branch and PR signals
- Optional use of repo-local scripts as one way to gather data
- Reference actions for repo-level, branch-level, and PR-level cleanup
- Promptfoo contract updates so evals expect prompt-driven guidance rather than
  a mandatory step order

Out of scope:

- Building a fully automated branch cleanup executor
- Broadening the skill into non-GitHub work tracking or roadmap workflows
- Replacing every manual GitHub operation with a script
- Changing the existing org cleanup thresholds unless the user asks

---

## Design Summary

The skill should be renamed to `maintaining-github-repos`, and it becomes an index plus a
set of focused reference pages.

`SKILL.md` should:

- describe when to use the skill in terms of trigger conditions, not a fixed
  workflow
- explain that the user may ask for org-level or repo-level checks in any order
- route the agent to the relevant reference file based on the prompt
- preserve the existing org cleanup script as an optional helper, not the
  default mandatory workflow

The detailed knowledge moves into references that are easier to scan and reuse.

---

## Reference Structure

```text
skills/maintaining-github-repos/
  SKILL.md
  references/
    org-level-signals.md
    repo-level-branch-signals.md
    repo-level-pr-signals.md
    repo-level-actions.md
    branch-level-actions.md
    pr-level-actions.md
  scripts/
    analyze_repos.py
    test_analyze_repos.py
```

### `SKILL.md`

Top-level routing and usage guidance:

- when to use the skill
- how to distinguish org-level vs repo-level questions
- how to handle prompt-driven requests for one or several checks
- when to use the repo-local `analyze_repos.py` helper
- when to stop and ask the user to confirm before destructive actions

### `references/org-level-signals.md`

Typical organization-wide hygiene signals:

- stale repositories
- empty or README-only repositories
- scratch or dev repositories that look disposable
- archived repositories worth rechecking
- repositories with unusually high branch counts
- organizations with long-idle open PR queues
- missing or weak branch protection on important repositories

For each signal, include:

- what it means
- how to inspect it
- default thresholds or heuristics
- what action families are appropriate next

### `references/repo-level-branch-signals.md`

Repo-level branch checks, including the metrics explicitly requested by the
user:

1. total branch count
2. merged branches vs remaining active branches
3. branches with no active commits for more than 5 days
4. follow-up branch categories worth reviewing

Recommended adjacent checks:

- branches whose PR is already merged but whose remote branch still exists
- branches with gone upstreams or tracking drift
- branches with no associated PR
- very old long-lived branches
- branch count spikes relative to normal repo activity

### `references/repo-level-pr-signals.md`

Repo-level PR health checks, including:

- PRs pending more than 48 hours
- PRs waiting on review
- PRs approved but not merged
- PRs failing required checks for extended periods
- stale draft PRs
- PRs with no assignee or no reviewer

### `references/repo-level-actions.md`

Actions for repository cleanup candidates:

- what to do for archive candidates
- what to do for delete candidates
- how to preview candidate sets before acting
- when to use the existing `analyze_repos.py` script
- when to stop for explicit confirmation

### `references/branch-level-actions.md`

Actions for branch cleanup candidates:

- how to handle merged remote branches
- how to handle stale unmerged branches
- how to verify a branch is safe to delete
- how to distinguish local branch cleanup from remote branch cleanup
- how to surface the exact scope before deletion

### `references/pr-level-actions.md`

Actions for PR follow-up candidates:

- when to nudge reviewers
- when to ask the author to rebase or close
- when to convert to draft or close as stale
- when a pending PR should block branch cleanup

---

## Prompt-Driven Behavior

This skill should no longer assume the user wants a single end-to-end cleanup
routine. The skill should support prompts like:

- "Check stale scratch repositories in accelerate-data."
- "For this repo, tell me how many branches we have and how many are merged."
- "Show branches with no commits for more than 5 days."
- "How many PRs have been pending more than 48 hours?"
- "What else should I inspect before deleting stale branches?"

Expected behavior:

- answer the requested subset directly
- add adjacent checks only as recommendations, not mandatory steps
- use repo-local commands and helpers when useful
- keep destructive steps behind explicit confirmation

---

## Repo-Level Metrics Required by This Design

The repo-level reference material must make the following checks easy to answer:

| Check | Default framing |
| --- | --- |
| Total branch count | Count all active branches in the repository, usually excluding the default branch when discussing cleanup candidates |
| Merged vs remaining | Distinguish branches already merged into the default branch from branches still unmerged |
| Inactive for more than 5 days | Use last commit timestamp as the baseline inactivity signal |
| PRs pending for more than 48 hours | Use PR age plus current state to identify review or merge backlog |

These checks should be documented with concrete `gh` and `git` command patterns
where practical.

---

## Command and Tooling Guidance

The skill should prioritize official local tooling:

- `gh` CLI for repo, branch, and PR inspection
- `git` for local and remote branch state where needed
- `skills/maintaining-github-repos/scripts/analyze_repos.py` for the existing
  org-level repo cleanup analysis flow

The skill should present commands as reference patterns rather than a
single required sequence.

---

## Safety Model

The reference skill must keep destructive actions explicit.

Rules:

- Listing signals is safe and should not require a confirmation gate.
- Recommending cleanup actions is safe and should not imply execution.
- Archive or delete operations on repositories still require preview and exact
  scope confirmation.
- Branch deletion guidance must separate local and remote deletion and require
  the agent to present the exact candidate set before acting.
- PR cleanup guidance must account for merged, approved, blocked, and abandoned
  states before recommending closure.

---

## Eval Impact

The current maintaining-github-repos eval contract is workflow-heavy and
org-specific. It should be revised so the skill still preserves the existing
org cleanup safeguards while also recognizing repo-level prompt-driven queries.

The updated eval surface should check for:

- correct routing between org-level and repo-level questions
- support for the requested branch and PR metrics
- preservation of destructive-action safeguards
- continued awareness of the repo-local `analyze_repos.py` helper
- prompt-driven guidance instead of a mandatory single sequence

---

## Acceptance Criteria

### Skill structure

- [ ] `skills/maintaining-github-repos/SKILL.md` is rewritten as a reference/index
      skill rather than a linear workflow
- [ ] Reference files exist for org-level signals, repo-level branch signals,
      repo-level PR signals, repo-level actions, branch-level actions, and
      PR-level actions
- [ ] The existing repo-local script remains available as an optional helper
      reference

### Coverage

- [ ] The skill documents org-level maintenance signals and how to identify them
- [ ] The skill documents repo-level branch signals including total branches,
      merged vs remaining, and inactivity over 5 days
- [ ] The skill documents repo-level PR signals including PRs pending over 48
      hours
- [ ] The skill recommends additional adjacent checks when the user asks what
      else to inspect

### Safety

- [ ] The skill does not force a fixed cleanup workflow before answering a
      focused question
- [ ] Destructive repo actions still require preview and exact scope
      confirmation
- [ ] Branch cleanup guidance distinguishes local vs remote deletion and merged
      vs unmerged branches
- [ ] PR follow-up guidance distinguishes pending review, blocked, approved, and
      stale states

### Evals and docs

- [ ] The maintaining-github-repos eval package and contract are updated for the
      new prompt-driven knowledge-skill behavior
- [ ] New Markdown files pass `markdownlint`
- [ ] `repo-map.json` and any other durable guidance are updated if the skill
      structure changes materially

---

## Design Decisions

| Decision | Rationale |
| --- | --- |
| Keep the existing skill name | Preserves discoverability and avoids unnecessary rename churn |
| Convert to a knowledge skill | Matches the user's goal of prompt-driven selective use |
| Split actions by repo, branch, and PR level | Keeps safety rules and cleanup logic separate |
| Keep `analyze_repos.py` as optional | Preserves useful automation without forcing a workflow |
| Preserve destructive-action safeguards | The skill can become more flexible without becoming less safe |
