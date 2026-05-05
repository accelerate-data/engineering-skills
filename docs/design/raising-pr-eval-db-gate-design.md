# Raising PR Eval DB Gate Design

## Goal

Reduce expensive promptfoo eval reruns during the `raising-linear-pr` workflow by using promptfoo's local DB as the source of the latest proven passing eval run, while only considering commits that actually changed the mapped inputs for each eval.

## Current Behavior

`skills/raising-linear-pr/SKILL.md` requires post-rebase quality gates and says to run the specific promptfoo evals for changed skills or commands. The workflow does not currently say how to determine whether a changed eval has already been run after the relevant change.

The eval harness stores promptfoo run history in `tests/evals/.tmp/promptfoo/promptfoo.db`. The `evals` table records run metadata, including `created_at`, `description`, and `config`; `eval_results` records pass/fail result rows.

## Desired Behavior

For each candidate promptfoo eval, the PR workflow should:

1. Map the eval command to the files that feed that eval.
2. Use a path-limited Git query against the default-branch merge base to find the latest commit that changed those files.
3. Query `tests/evals/.tmp/promptfoo/promptfoo.db` for the latest fully passing run of that eval.
4. Skip the eval when the latest passing DB run is newer than the latest content-relevant commit.
5. Run the eval when the DB is missing, unreadable, has no matching passing run, or the latest content-relevant commit is newer than the latest passing DB run.
6. Print the run/skip evidence for each eval.

The workflow must not use unrelated branch commits or rebase-only timestamp churn as evidence that an eval is stale. Commit dates matter only after path filtering has established that the commit changed inputs for that eval.

## Eval Coverage

Add raising-PR promptfoo contract fields that require the workflow to:

- inspect the promptfoo DB for latest passing eval runs
- compare DB run times to path-limited, content-relevant Git changes
- avoid full eval-suite runs by default
- run only stale targeted evals
- fall back to running affected evals when DB evidence is unavailable

This is feasible as an eval because the raising PR skill is already evaluated through a structured JSON contract. The new test does not need to execute promptfoo DB queries; it verifies that an agent reading the skill will choose the correct workflow.

## Scope

This change updates the workflow contract and its eval coverage. It does not add a helper script yet. If the promptfoo DB query becomes too verbose or inconsistent in practice, a follow-up can add a small deterministic helper under `tests/evals/scripts/`.
