# reviewing-prs Skill — Design Document

**Status:** Draft
**Destination:** `engineering-skills` plugin

---

## Goal

Add a `reviewing-prs` skill that starts from an existing GitHub PR, creates a temporary review worktree, gathers the PR's surrounding context, verifies acceptance criteria when possible, performs a review, drafts the GitHub PR review event, asks the user before posting it, and then cleans up the review worktree.

This skill is the review phase for an already-open PR. It does not create the PR, implement code changes, merge, or close out the branch.

---

## Scope

In scope:

- Resolve a PR from URL, number, or branch
- Create a sibling temporary worktree from the PR branch
- Read the PR body and code changes to frame what the PR claims to do and what the code actually does
- Resolve the linked Linear issue when present
- Read Linear-linked design docs, implementation plans, and any attached or linked documents from the Linear issue
- Read `docs/functional/` and actively search for related functional specs
- Ask the user to confirm ambiguous spec or document mapping before proceeding
- Verify unchecked acceptance criteria from Linear and unchecked task-list items in the PR body
- Run targeted repo validation or tests when they are needed to prove an acceptance criterion
- Check off acceptance criteria only when they are proven by existing code and test evidence
- Perform code review and simplification review
- Choose a proposed GitHub PR review event: `APPROVE`, `REQUEST_CHANGES`, or plain `COMMENT`
- Present the drafted review and ask for approval before posting it
- Post the GitHub PR review event after explicit user approval
- Clean up the temporary review worktree at the end

Out of scope:

- Creating or updating implementation commits
- Raising the PR in the first place
- Merging the PR
- Closing the Linear issue or cleaning up the feature branch after merge
- Speculatively checking off acceptance criteria without evidence

---

## Core Framing Model

The skill should always separate three different questions:

### PR Claim

What the PR says it does.

Source this only from:

- the PR body
- the actual code changes

The Linear issue must not redefine the PR's claimed scope.

### Required Scope

What the PR is supposed to do.

Source this from:

- the linked Linear issue
- the Linear acceptance criteria
- related functional specs
- linked design documents
- linked implementation plans
- any attached or linked documents reachable from the Linear issue

### Implemented Scope

What the code actually does.

Source this from:

- changed files
- tests added or changed
- docs updated in the PR
- any behavior implied directly by the diff

The review result is based on the gaps between these three sections.

---

## Trigger and Inputs

The PR is the trigger.

Accepted entry forms:

- full GitHub PR URL
- PR number in the current repo
- branch name when it maps unambiguously to an open PR

Linear is an optional but important secondary input. If a linked Linear issue is present, its acceptance criteria become part of the review contract.

If the PR body contains unchecked Markdown task-list items, treat them as PR-side acceptance criteria and review them alongside the Linear criteria.

---

## Workflow

### Phase 0 — Resolve PR and Create Review Worktree

1. Resolve the target PR and confirm the repo and head branch.
2. Create a sibling temporary worktree for the PR branch.
3. Fetch the branch state needed for review.
4. Abort if the review worktree cannot be created cleanly.

The review worktree is disposable and must be removed during cleanup.

### Phase 1 — Gather Review Context

Read the PR body first, then inspect the code changes.

Capture:

- PR title and body
- linked issues or docs from the PR body
- changed files and diff shape
- tests added, changed, or missing
- current PR review and check state when available

Then gather the broader requirement context:

- linked Linear issue
- Linear acceptance criteria
- Linear-linked design docs
- Linear-linked implementation plans
- any attached or linked supporting docs from the Linear issue
- related functional specs discovered by reading `docs/functional/` and actively searching for likely matches

If related-spec discovery is uncertain, ask the user to confirm the mapping once, then continue based on the answer.

### Phase 2 — Frame the Review

Before any approval decision, produce three internal summaries:

- `PR Claim`
- `Required Scope`
- `Implemented Scope`

Then compare them and identify:

- in-scope work
- missing required work
- extra or off-scope work
- design or spec mismatches
- acceptance criteria that appear already satisfied
- acceptance criteria that remain open or unproven

### Phase 3 — Verify Acceptance Criteria

For each unchecked acceptance criterion in Linear or the PR body:

1. Check whether the current code and diff already satisfy it.
2. If code inspection is insufficient, run the narrowest targeted validation or tests that can prove it.
3. Check it off only when the criterion is proven by committed code plus evidence.

Hard rule:

- If any acceptance criterion remains open, ambiguous, blocked, or unproven, stop the approval path.

When the skill stops for open criteria, it should draft review feedback with concrete next steps and must not post an approval review.

### Phase 4 — Review the Code

Run two review lenses:

- code review for correctness, scope alignment, regressions, and missing tests
- simplification review for avoidable complexity without changing behavior

This phase is read-only. It may recommend implementation follow-up, but it may not edit code.

### Phase 5 — Choose Review Outcome

The skill should choose one proposed outcome:

- `APPROVE` when required scope is satisfied, code review passes, simplification concerns are non-blocking, and all relevant acceptance criteria are checked or can be checked off based on evidence
- `REQUEST_CHANGES` when scope, acceptance criteria, correctness, or testing gaps block approval
- `COMMENT` when the review should communicate important context without formal approval or formal change-request semantics

If the PR is substantially mis-scoped relative to the issue or specs, the skill may recommend closing the PR in the drafted review comment instead of trying to force it through review.

If the PR is fully aligned and ready, the drafted approval may also recommend merge as the next step, but the skill itself does not merge.

### Phase 6 — Draft, Confirm, and Post Review

Before any GitHub side effect, present:

- the proposed review event type
- the drafted review text
- any acceptance criteria that were checked off
- any remaining next steps or risks

Wait for explicit user approval before posting.

After approval, post a real GitHub PR review event:

- `APPROVE`
- `REQUEST_CHANGES`
- plain `COMMENT`

### Phase 7 — Cleanup

Always remove the temporary review worktree before finishing unless cleanup itself fails.

If cleanup fails, report the exact path and failure so the user can remove it manually.

---

## Draft Review Content

The drafted review should be structured around the review decision, not as a raw brain dump.

Expected sections:

- short verdict
- scope comparison summary
- acceptance-criteria status
- findings ordered by severity
- next steps

When the outcome is `REQUEST_CHANGES`, the comment should clearly distinguish blockers from optional polish.

When the outcome is `APPROVE`, the comment should still call out any non-blocking risks or follow-up work.

When the outcome is effectively "this PR should probably be closed," the comment should say that directly and explain why the PR is too far from the required scope.

---

## Relationship to Existing Skills

`reviewing-prs` should remain distinct from existing skills:

- `raising-linear-pr` owns PR creation and transition into review, not deep review of an already-open PR
- `closing-linear-issue` owns merge and cleanup after the PR is approved and merged
- `adversarial-review` is an optional extra-critical review pattern, not the default PR review workflow
- `code-simplifier` informs the simplification lens, but `reviewing-prs` owns the PR review decision and posting flow

This skill is the review workflow for an existing PR, not a replacement for the surrounding Linear lifecycle skills.

---

## Safety Rails

- Never post a GitHub PR review event without explicit user approval.
- Never check off a Linear or PR acceptance criterion without code or test evidence.
- Never proceed to approval while any relevant acceptance criterion remains open or unproven.
- Never treat Linear alone as the source of what the PR claims to do.
- Never silently guess uncertain document or spec mapping; ask once and proceed from the answer.
- Never edit implementation files as part of the review workflow.
- Never leave the temporary review worktree behind on a successful run.

---

## Acceptance Criteria

- [ ] `skills/reviewing-prs/SKILL.md` exists and clearly defines the PR-triggered review workflow
- [ ] The skill creates a sibling temporary worktree from the PR branch and cleans it up at the end
- [ ] The skill reads the PR body and the code changes before framing the review
- [ ] The skill separates `PR Claim`, `Required Scope`, and `Implemented Scope`
- [ ] The skill resolves the linked Linear issue when present and reads its acceptance criteria
- [ ] The skill reads Linear-linked design docs, implementation plans, and attached or linked documents
- [ ] The skill reads `docs/functional/` and actively searches for related functional specs
- [ ] The skill asks the user to confirm uncertain spec or document mapping before proceeding
- [ ] The skill treats unchecked PR-body task-list items as PR-side acceptance criteria
- [ ] The skill verifies unchecked acceptance criteria from code first, then targeted tests when needed
- [ ] The skill checks off acceptance criteria only when they are proven by existing code and evidence
- [ ] The skill stops the approval path when any relevant acceptance criterion remains open or unproven
- [ ] The skill performs both code review and simplification review
- [ ] The skill drafts a GitHub PR review event and asks the user before posting it
- [ ] The skill can post `APPROVE`, `REQUEST_CHANGES`, or plain `COMMENT` after approval
- [ ] The skill can recommend closing a badly mis-scoped PR in the drafted review comment
- [ ] The skill can recommend merge in the drafted approval comment when the PR is ready

---

## Open Questions

1. Whether v1 should use only targeted repo checks from `repo-map.json`, or whether it may escalate to broader repo-wide validation when targeted evidence is insufficient.
2. Whether AC checkoff for PR-body Markdown tasks should edit the PR body directly or leave those checkboxes as advisory-only when the GitHub surface used by the skill cannot safely update them.
