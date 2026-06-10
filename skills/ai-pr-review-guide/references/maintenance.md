# Maintenance & Sync (source of truth)

This skill is the **master copy** of the review guide consumed by vd-studio's
automated AI PR reviewer (OpenHands `pr-review` plugin, wired in
`.github/workflows/ai-pr-review.yml`).

## Deployed copy

vd-studio consumes the guide as an OpenHands project skill at:

```
vd-studio/.agents/skills/ai-pr-review-guide.md
```

The OpenHands plugin auto-discovers every file under `.agents/skills/` in the
reviewed repo (`load_project_skills`) — no workflow configuration points at the
file, so the filename only needs to stay a valid skill file.

## Edit workflow (manual sync — deliberate choice)

1. Edit `SKILL.md` here.
2. Run the evals: `cd tests/evals && npm run eval:ai-pr-review-guide`.
   All rule scenarios must pass before syncing.
3. Copy the updated `SKILL.md` body (including frontmatter) over the vd-studio
   deployed copy and raise a vd-studio PR.
4. The vd-studio copy carries a header comment pointing back to this master —
   keep it intact.

Nightly CI sync was considered and rejected (AD-55): the skill changes rarely,
and manual sync keeps testing/refinement in this repo where the evals live.

## What the evals cover

`tests/evals/packages/ai-pr-review-guide/` exercises the skill's rules against
diff scenarios with known answers (seeded from the VD-2105 benchmark):

- missing unit tests on new logic → unit verdict must flag
- new API endpoint without a flow spec → flow verdict must flag
- tests present → no false demands; journey never over-asked; BDD never demanded
- clean diff → quiet review, READY verdict
- no-new-findings re-review → summary still posted (posting contract)
- report format → fixed section order + machine-readable verdict line
