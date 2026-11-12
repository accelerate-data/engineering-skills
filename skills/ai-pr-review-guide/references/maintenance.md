# Maintenance & Sync (source of truth)

This skill is the **master copy** of the review guide consumed by vd-studio's automated AI PR reviewer (`scripts/ai-pr-review/review.py`, run by
`.github/workflows/ai-pr-review.yml`).

## How vd-studio reads it

vd-studio keeps no copy. Its `ai-pr-review.yml` checks out this repository's `main` on every review and passes this folder to the script as `GUIDE_DIR`. The script sends sections 1-5 to the model and renders sections 6-8 itself.

## Edit workflow

1. Edit `SKILL.md` here.
2. Run the evals: `cd tests/evals && npm run eval:ai-pr-review-guide`.
   Run them on the model CI uses: set `OPENCODE_MODEL` to that model. OpenCode 2
   ignores the per-agent `model` in `tests/evals/opencode.json`, so without the
   variable the run uses your global default model.
   All rule scenarios must pass before merging.
3. Before merging, check the change against vd-studio's reviewer, because a merge applies to its next review: from vd-studio, set `GUIDE_DIR` to this folder and run `python3 scripts/ai-pr-review/review_test.py` and `python3 scripts/ai-pr-review/eval_planted.py`.

## What the evals cover

`tests/evals/packages/ai-pr-review-guide/` exercises the skill's rules against diff scenarios with known answers (seeded from the VD-2105 benchmark):

- missing unit tests on new logic → unit verdict must flag
- new API endpoint without a flow spec → flow verdict must flag
- tests present → no false demands; journey never over-asked; BDD never demanded
- clean diff → quiet review, READY verdict
- no-new-findings re-review → summary still posted (posting contract)
- report format → fixed section order + machine-readable verdict line
- bug in a file the diff does not touch → no finding, ready
- only 🟠 and 🟡 findings → ready; only a proven 🔴 or a flagged lane blocks
- harness or twin change → reviewed like any other diff, ready when nothing blocks (the script adds an advisory Human Review Advised section)
- re-review after a fix → no new finding on a line an earlier round reviewed
- proven crash with an exact input → 🔴, not ready
- stale comment only → 🟡, ready
- suspected test failure the reviewer cannot run → no CI claim, no blocker
- concern against the PR's stated goal → no finding against the goal
- findings exist → each posted inline, report posted once
- clean diff → Findings "None.", no invented finding
- first review with many notes → every 🔴 and 🟠 listed now, none held back
