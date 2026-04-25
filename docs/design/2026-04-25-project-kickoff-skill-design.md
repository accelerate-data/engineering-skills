# Project Kickoff Skill

**Date:** 2026-04-25
**Status:** Draft design
**Repository:** `engineering-skills`

## Problem

Accelerate Data agents repeatedly need the same repository context before they
can work safely: project purpose, ownership boundaries, docs placement,
repo-map expectations, Linear workflow, testing conventions, and agent-specific
instruction surfaces. Today that context is usually recreated ad hoc by reading
`README.md`, `AGENTS.md`, `CLAUDE.md`, `repo-map.json`, git history, and local
docs.

`Maximepodgorski/agent-skills` includes a `kickoff` skill that interviews a
project and generates structured `.context/` docs plus `CLAUDE.md`. The shape
is useful, but it should not be vendored into `AD Design System`: it is not a
design-system skill. It also needs strong AD-specific behavior around Codex,
Claude, Linear, repo standards, and documentation placement.

## Decision

Create an AD-native `project-kickoff` skill in `engineering-skills`.

The skill may use the upstream `kickoff` workflow as design inspiration, but it
will not be weekly-synced or treated as vendored source. Accelerate Data owns
the behavior and evolves it with the engineering skill suite.

## Goals

- Provide a repeatable kickoff workflow for new or poorly documented
  engineering repositories.
- Generate and maintain the repo guidance files AD agents actually use.
- Support both Claude and Codex without treating `CLAUDE.md` as the universal
  output.
- Capture durable context in repo-local docs instead of relying on chat
  history.
- Fit existing `engineering-skills` conventions for skill layout, docs, evals,
  and manifest versioning.

## Non-goals

- Do not add this skill to `ad-design-system`.
- Do not vendor-sync upstream `kickoff`.
- Do not create Linear issues automatically during kickoff.
- Do not overwrite existing `AGENTS.md`, `CLAUDE.md`, `README.md`, or
  `repo-map.json` without a merge plan and user confirmation.
- Do not generate business or marketing strategy docs unless the target repo
  already has a clear need for them.

## Skill Scope

The skill owns engineering onboarding and context maintenance for a target repo.
It should trigger on phrases such as:

- "project kickoff"
- "repo kickoff"
- "onboard this repo"
- "create agent guidance"
- "refresh repo context"
- "generate AGENTS.md"
- "update repo-map"

The skill writes or updates a small set of repo-standard artifacts:

```text
AGENTS.md                 # canonical cross-agent instructions
CLAUDE.md                 # Claude adapter, if the repo uses Claude
repo-map.json             # current structure, commands, eval/test layout
docs/design/              # durable design docs
docs/plan/                # implementation plans
docs/user-guide/          # user-facing guides
docs/reference/           # reference material, when needed
.claude/                  # governance placeholders only where repo standards require them
```

The exact output set is determined by the target repo's current state. The
skill should repair stale guidance when it can do so safely, but it should not
force every repo to contain every possible file.

## Workflow

### Phase 1: Bootstrap Scan

Read the target repo before asking broad questions:

- `README.md`
- `AGENTS.md`
- `CLAUDE.md`
- `repo-map.json`
- package manifests and build files
- `.github/workflows/`
- existing `docs/`
- git remote and recent commits
- Linear references in branches, PR templates, or docs

The scan records what was observed, what is missing, and what looks stale.

### Phase 2: Brainstorming Handoff

After the bootstrap scan, the skill must explicitly hand off to
`superpowers:brainstorming` before it designs or rewrites repo guidance. The
handoff gives brainstorming the observed repository context, suspected repo
classification, stale guidance findings, and the specific context gaps that
need user input.

The handoff is required because project kickoff is a design activity: it
decides how the repo should represent purpose, workflow, docs structure, and
agent behavior. `project-kickoff` owns the repository-specific scan and final
artifact updates; `superpowers:brainstorming` owns the collaborative shaping of
the target guidance model before files change.

The handoff should ask brainstorming to produce a concise approved design for:

- canonical instruction hierarchy
- required guidance files
- docs placement conventions
- repo-map scope
- issue/project workflow notes
- generated or vendored-source warnings
- any repo-specific exceptions

No file edits happen until that design is approved.

### Phase 3: Repo Classification

Classify the repo by role:

- plugin source repo
- marketplace/index repo
- application repo
- docs/spec repo
- library/package repo
- infrastructure repo

Classification drives which guidance files are required and which docs
directories are expected.

### Phase 4: Gap Interview

Ask only for information that cannot be inferred from the repository. Keep the
interview short and targeted:

- project purpose and owner
- supported runtime or deployment surface
- canonical test and validation commands
- issue tracker and Linear project
- docs placement exceptions
- agent-specific constraints

The skill should capture "not decided yet" explicitly instead of inventing
policy.

### Phase 5: Context Model

Build an internal context model before writing files:

- purpose
- structure
- commands
- test/eval surfaces
- docs conventions
- issue workflow
- agent instruction hierarchy
- generated-file and vendored-source boundaries

This model is the source for proposed file edits.

### Phase 6: Proposed Changes

Present a concise change plan before modifying files. The plan should identify:

- files to create
- files to update
- files intentionally left alone
- stale guidance being repaired
- any risky merge points

If an existing file has custom sections, the skill must preserve them and
explain how generated or refreshed sections will be bounded.

### Phase 7: Apply Changes

Write or update the approved artifacts:

- `AGENTS.md` as the canonical cross-agent guidance.
- `CLAUDE.md` only as a Claude-specific adapter and routing file.
- `repo-map.json` with current structure and commands.
- docs directories only when the repo's conventions require them.

The skill should prefer folder-level `README.md` entrypoints when creating
durable docs trees.

### Phase 8: Self-review

Review generated context before completion:

- no placeholders such as `TODO` or `TBD` unless intentionally captured
- no stale paths
- no contradictions between `AGENTS.md`, `CLAUDE.md`, and `repo-map.json`
- no cross-repo references that will break after plugin installation
- docs placement matches repo conventions
- vendored or generated directories are clearly marked

### Phase 9: Verification

Run lightweight checks appropriate for the repo:

- `git diff --check`
- markdownlint when configured
- repository validators when present
- manifest validation when plugin manifests changed

The skill should not run expensive eval suites unless it changed skill runtime
behavior or the user asks for that level of verification.

## Output Contracts

### AGENTS.md

`AGENTS.md` is the canonical cross-agent instruction file. It should contain
durable rules only: repo purpose, instruction hierarchy, docs placement,
testing expectations, ownership boundaries, and workflow constraints.

It must not duplicate volatile file inventory that belongs in `repo-map.json`.

### CLAUDE.md

`CLAUDE.md` is an adapter for Claude-specific routing and command behavior. It
should point back to `AGENTS.md` for canonical policy.

### repo-map.json

`repo-map.json` is the current structural index. It should include key
directories, commands, test/eval surfaces, skills or modules, and notes for
agents about what to refresh when structure changes.

### Docs

The skill should use AD repo conventions:

- `docs/design/` for design documents.
- `docs/plan/` for implementation plans.
- `docs/user-guide/` for user-facing guides.
- `docs/reference/` for durable reference material.

If a repo's `AGENTS.md` defines a different convention, repo-local guidance
wins.

## Relationship To Upstream Kickoff

The upstream `kickoff` skill is reference material, not vendored runtime. The
AD skill borrows these ideas:

- bootstrap before interviewing
- structured context instead of chat-only memory
- merge instead of overwrite
- explicit review for stale guidance

The AD skill diverges intentionally:

- Codex uses `AGENTS.md`, not `CLAUDE.md`.
- `repo-map.json` is first-class.
- Linear and AD project management conventions are first-class.
- Documentation placement follows AD repo standards.
- Business, marketing, and team docs are optional and only generated when the
  target repo genuinely needs them.

## Implementation Shape

```text
skills/project-kickoff/
  SKILL.md
  references/
    bootstrap-scan.md
    repo-classification.md
    guidance-files.md
    repo-map-contract.md
    self-review.md
```

`SKILL.md` should stay concise and route to reference files for detailed
contracts. Reference files should be self-contained and avoid examples that
depend on a specific product repo unless they are clearly labeled as examples.

## Evals

Add Promptfoo coverage after the first implementation because this skill changes
agent behavior materially.

Initial eval scenarios:

- New plugin repo with no guidance files creates the right proposed outputs.
- Existing repo with `AGENTS.md` and stale `repo-map.json` proposes repair
  without overwriting custom sections.
- Codex-oriented repo does not generate Claude-only instructions as canonical
  policy.
- Vendored-source repo gets explicit "warn before editing" guidance.
- Marketplace/index repo keeps plugin code out of the index repo.

Deterministic compatibility checks must continue to pass:

- `npm run eval:coverage`
- `npm run eval:codex-compatibility`

## Manifest Impact

Adding the skill changes runtime plugin content. Implementation must bump both
manifests together:

- `.claude-plugin/plugin.json`
- `.codex-plugin/plugin.json`

Then run:

```bash
npm run validate:plugin-manifests
```

## Open Questions

- Should the skill name be `project-kickoff`, `repo-kickoff`, or
  `onboarding-repo`?
- Should the skill generate `.context/` source files, or keep context directly
  in `AGENTS.md`, docs, and `repo-map.json`?
- Should the first implementation include a slash command wrapper, or rely on
  skill routing only?
