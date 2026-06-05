# `creating-product-issues` Skill Design

| Field | Value |
|---|---|
| Date | 2026-05-15 |
| Author | Shwetank Sheel |
| Repo | `accelerate-data/engineering-skills` |
| Status | Approved — ready for implementation plan |
| Source skill | `engineering-skills/skills/creating-linear-issue/` |
| Supersedes | `accelerate-data/product-skills/docs/superpowers/specs/2026-05-15-product-skills-bootstrap-design.md` (scope reduced from new repo to new skill) |

## 1. Context

This spec adds a single skill, `creating-product-issues`, to `engineering-skills`. It is the scoped-down successor to the earlier `product-skills` repository bootstrap design.

The skill lets AD engineers file product issues into Linear's `Studio` or `Utilities` teams. It is distinguished from `creating-linear-issue` (engineering tickets) by three behavioral rules:

1. Hard team allowlist: `Studio` or `Utilities` only.
2. No `project`, `milestone`, or `cycle` assignment on the filed issue.
3. Owner is resolved from a static team-to-owner map, not from the engineer running the skill.

The audience is internal AD engineers. There is no external-audience framing. If external rollout becomes a real ask later, that is a separate, future decision; this spec does not encode an extraction path.

## 2. Scope

### 2.1 In scope

- New skill at `skills/creating-product-issues/` with `SKILL.md` and two new references.
- Cross-linked references to `creating-linear-issue`'s `bug-intake.md` and `issue-breakdown.md` (no copy, no symlink — relative-path references inside `SKILL.md`).
- Eval package at `tests/evals/packages/creating-product-issues/` with one smoke test and five scenarios.
- Slash command at `commands/creating-product-issues.md`.
- One-line addition to the Skills section in `AGENTS.md`.
- User-guide page at `docs/user-guide/creating-product-issues.md`, authored via the `doc-skills:authoring-user-guide` skill.

### 2.2 Out of scope (deferred)

- Promotion of the eval package to `eval_tier: standard`. Revisit after the skill has been used against real internal requests.
- Marketplace listing.

## 3. Behavior

### 3.1 Workflow diff against `creating-linear-issue`

| Step | `creating-linear-issue` | `creating-product-issues` |
|---|---|---|
| 1 | Classify feature / bug / spike | Same |
| 2 | Search codebase and existing Linear issues | Same |
| 3 | Resolve `team`, `project`, `milestone`, `assignee`, `cycle`, User Flow | Resolve `team` (must be `Studio` or `Utilities`); resolve User Flow child label; resolve `owner` from the static team-to-owner map. No project, no milestone, no cycle. |
| 4 | For selected teams, read the functional spec | Same |
| 5 | Search and read related design docs | Same |
| 6 | Use `superpowers:brainstorming` for broad features | Same |
| 7 | Use `bug-intake.md` for bugs | Same (cross-linked to source) |
| 8 | Use `issue-breakdown.md` for oversized requests | Same (cross-linked to source) |
| 9 | Confirm resolved fields with the user in one question | Same (smaller field set: team, owner, User Flow label) |
| 10 | Show draft and create/update only after approval | Same |

### 3.2 Hard gates

1. Stop if the resolved team is anything other than `Studio` or `Utilities`. Explain the policy and ask the user to email `ss@acceleratedata.ai` if the right target is unclear.
2. Stop if no User Flow child label is confirmed for the resolved team. The label is required for downstream triage.
3. Do not draft while team resolution, User Flow label, owner resolution, brainstorming outcomes, bug-intake gaps, decomposition gaps, functional spec, or related design docs remain unresolved.
4. Do not ask the user for details already answered by the original request or by existing Linear issues.

The source skill's gates on `project`, `milestone`, `assignee`, and `cycle` are removed. The source skill's spec-read gate is retained.

### 3.3 Boundary

The skill ends at "issue created or updated in Linear." It does not implement the issue, raise a PR, or run any code. Internal AD triage picks up from the filed issue. There is no named handoff skill.

## 4. Files

### 4.1 New files under `skills/creating-product-issues/`

```
skills/creating-product-issues/
├── SKILL.md
└── references/
    ├── field-resolution.md      # NEW
    └── linear-operations.md     # NEW
```

### 4.2 Cross-linked references

`SKILL.md` references two files in the sibling skill by relative path:

- `../creating-linear-issue/references/bug-intake.md`
- `../creating-linear-issue/references/issue-breakdown.md`

The wording in `SKILL.md` is direct, with no extraction caveats:

> For bug intake, follow `../creating-linear-issue/references/bug-intake.md`. For oversized requests, follow `../creating-linear-issue/references/issue-breakdown.md`. These references are shared with `creating-linear-issue` inside this repo.

### 4.3 `field-resolution.md` contents

- Critical fields: `team` (allowlist), `owner` (from the static map below), User Flow child label.
- Non-fields: explicit "do not set project, milestone, or cycle" with the reasoning so a future maintainer does not restore them.
- Hard gates 1 and 2 from §3.2.
- Static team-to-owner map:

| Team | Owner | Email |
|---|---|---|
| Studio | Umesh Kakkad (UK) | uk@acceleratedata.ai |
| Utilities | Hemanta Banerjee (HB) | hb@acceleratedata.ai |

At issue-creation time, the skill resolves the Linear user from the email above using the standard Linear user lookup. There is no `get_team` call and no team default-owner lookup.

### 4.4 `linear-operations.md` contents

- User Flow child-label lookup mechanic, pared down from `creating-linear-issue`'s `linear-operations.md` to the product use case.
- Linear-user-lookup-by-email note for owner resolution. The skill retries the user lookup once on failure; on a second failure, it stops and reports the exact failing call.

### 4.5 Slash command

`commands/creating-product-issues.md` is a thin wrapper modeled on existing command files in this repo. The name matches the skill, in line with the repo's `creating-*` convention.

### 4.6 `AGENTS.md` change

One-line addition to the Skills section:

```
- `skills/creating-product-issues/SKILL.md` - file a product issue into Linear's Studio or Utilities team
```

No other `AGENTS.md` changes. Repo Purpose, Linear section, Conventions, and audience framing all stay as-is (internal AD engineering tooling).

### 4.7 User guide

`docs/user-guide/creating-product-issues.md`, authored via `doc-skills:authoring-user-guide`. Audience: AD engineers. Covers when to use the skill, what each hard gate means, and what to do when a gate fires.

## 5. Eval package

### 5.1 Location and shape

```
tests/evals/packages/creating-product-issues/
├── promptfooconfig.json
├── prompts/
└── assertions/
```

Modeled on `tests/evals/packages/creating-linear-issue/`. Metadata: `eval_tier: light` (promotion to `standard` is deferred per §2.2).

### 5.2 Tests

One smoke test plus five scenarios.

1. **`[smoke]` Golden path — Studio request.** Engineer pastes a feature request for the Studio team. Skill resolves `team=Studio`, resolves owner from the static map (Umesh / uk@acceleratedata.ai), asks one confirmation question covering team, owner, and User Flow label, then creates the issue. *Assertions:* the create call has `team` in `{Studio, Utilities}`, an owner field set, a User Flow label present, and no `project`, `milestone`, or `cycle` field in the payload.

2. **Off-list team.** Request maps to a team other than Studio or Utilities. *Assertions:* skill stops, explains the policy, surfaces `ss@acceleratedata.ai`, and issues no Linear create call.

3. **Bug intake.** Request is a bug report. *Assertions:* skill walks the `bug-intake.md` checklist (symptom, impact, expected vs actual, repro, consistency, severity); no draft until all required fields are captured or explicitly waived.

4. **Oversized request.** Request describes multiple independent features. *Assertions:* skill routes to `superpowers:brainstorming` for decomposition before any draft.

5. **Ambiguous User Flow label.** Resolved team has multiple plausible child labels for the request. *Assertions:* skill asks one targeted clarifying question listing the candidates with a recommended pick; no draft until the user confirms a label.

6. **Owner email lookup failure.** Mock the Linear user-by-email lookup to fail for the resolved owner. *Assertions:* skill retries once; on second failure, stops and reports the exact failing call; issues no create call.

### 5.3 Repo-level wiring

- Add `eval:creating-product-issues` script to root `package.json`.
- Add `creating-product-issues` to `tests/evals/skill-eval-coverage-baseline.json`.
- `npm run eval:codex-compatibility` picks up the new package automatically via its glob; no edit needed.

## 6. Verification

At the end of implementation, independent of the eval suite:

- `npm run eval:coverage` passes with `creating-product-issues` in the baseline.
- `npm run eval:codex-compatibility` passes.
- `npm run validate:plugin-manifests` passes (no manifest changes expected; cheap insurance).
- `npm run check:skill-prose-wraps` passes on the new `SKILL.md` and references.
- `markdownlint` clean on all new `.md` files, including `docs/user-guide/creating-product-issues.md`.
- Manual smoke: invoke `/creating-product-issues` with a one-line Studio request in a real session, confirm the skill walks through to a draft and stops at the confirmation gate without errors.

## 7. Open questions

None.

## 8. References

- Source skill: `/Users/shwetanksheel/scratch/ad-plugins/engineering-skills/skills/creating-linear-issue/`
- Superseded design (new-repo bootstrap): `/Users/shwetanksheel/scratch/ad-plugins/product-skills/docs/superpowers/specs/2026-05-15-product-skills-bootstrap-design.md`
- Cross-linked references:
  - `/Users/shwetanksheel/scratch/ad-plugins/engineering-skills/skills/creating-linear-issue/references/bug-intake.md`
  - `/Users/shwetanksheel/scratch/ad-plugins/engineering-skills/skills/creating-linear-issue/references/issue-breakdown.md`
- User-guide authoring skill: `doc-skills:authoring-user-guide`
