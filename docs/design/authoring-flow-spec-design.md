# authoring-flow-spec Skill — Design Spec

**Date:** 2026-04-24
**Branch (engineering-skills):** `feature/authoring-flow-spec`
**Branch (vd-specs-product-architecture):** `feature/relocate-flow-specs`
**Status:** Approved, ready for implementation planning

---

## Problem

User-flow specifications in the Vibedata product architecture currently live at
`user-flows/flows/<category>/<slug>.md` inside
`github.com/accelerate-data/vd-specs-product-architecture`. Two pressures have
shifted that model:

1. Session 19b2675d established a new home for flow specs: each flow's spec
   now ships in its **target repo** at `docs/functional/<Canonical ID>/`.
   The target repo is whichever value appears in column C (`repo`) of the
   User-Flows-Details Sheet for that row — there is no hardcoded list of
   target repos in the skill (the active set at the time of writing is
   `studio`, `skill-builder`, `domain-cicd`, `migration-utility`, but Sheet
   column C is canonical).
2. The authoring template (`_flow-spec-template.md`) and its rationalization
   document are useful far beyond the architecture repo; they describe a
   discipline that every target repo now needs. Keeping them pinned inside
   `vd-specs-product-architecture` limits reuse.

Consequence: authoring a new flow spec today requires the author to
(a) know the template lives in a third repo, (b) remember the altitude rules
it enforces, (c) hand-pick the correct target location across four repos, and
(d) wire up Sheet metadata consistently. Nothing enforces this; drift is
already visible (2 of 4 existing flows in `vd-specs-*` were authored under a
pre-rationalization template and have not been refactored).

---

## Goals

1. A dedicated authoring workflow — **skill + command** — owns the end-to-end
   path from canonical ID to committed flow-spec markdown in the correct target
   repo, enforcing template adherence and altitude rules.
2. The skill triggers broadly on natural-language cues authors actually use
   ("flow spec", "PRD", "functional spec", "user flow", "behavior spec", "journey
   map") so authors do not need to remember the skill's exact name.
3. The template and its rationalization become the **skill's** canonical
   source of truth. The `vd-specs-product-architecture` repo no longer owns
   either file.
4. Pre-work migrates the 22 existing flow files in `vd-specs-product-architecture`
   to an archive location without loss of git history, updates dependent rules
   and links, and switches the Sheet's Filename HYPERLINK formula to the new
   cross-repo pattern.
5. The skill composes with the existing superpowers ecosystem — it hands
   drafting pressure-test work to `superpowers:brainstorming` rather than
   reimplementing a brainstorming loop.

---

## Non-goals

- **Status updates.** The existing `update-flow-status` command owns writes to
  Sheet columns H/F/G. This skill never touches those.
- **Sheet row creation.** If a canonical ID has no Sheet row, the skill aborts
  and points the author at the `.claude/rules/user-flows-sheet-sync.md` rule.
  It never appends rows on the author's behalf.
- **Migration of archived flows.** The 4 real flow files + 18 child files
  currently in `user-flows/flows/` move to `user-flows/_archive/flows/`.
  They do **not** get re-authored into the target repos as part of this work.
  Re-authoring is a separate, per-flow exercise done later via this skill.
- **`git push` automation.** The skill offers a commit; the author decides when
  (or whether) to push. No auto-push.
- **Evals.** A promptfoo eval suite is explicitly deferred to a follow-up
  issue once the skill has baked through real usage.

---

## Design overview

```text
┌────────────────────────────┐                 ┌────────────────────────────┐
│  ad-plugins/                │                 │  vd-specs-product-         │
│  engineering-skills/        │                 │  architecture/              │
│                            │                 │                            │
│  skills/                   │                 │  user-flows/                │
│    authoring-flow-spec/    │                 │    _archive/flows/          │
│      SKILL.md              │                 │      (all 22 old files)    │
│      references/           │   "canonical   │    status/README.md         │
│        flow-spec-          │    template    │      (points → skill)      │
│        template.md         │    lives here" │    CLAUDE.md                │
│        flow-spec-          │◀────────────────│      (points → skill)      │
│        template-           │                 │                            │
│        rationalization.md  │                 │  .claude/rules/             │
│        sheet-interop.md    │                 │    user-flows-sheet-        │
│        writing-the-draft.md│                 │    sync.md                 │
│                            │                 │      (path layout rewrite) │
│  commands/                 │                 │                            │
│    author-flow-spec.md     │                 │  (Sheet col L HYPERLINK    │
│                            │                 │   formula updated to use   │
│  .claude-plugin/plugin.json│                 │   col C = repo)            │
│    version: 1.0.6 → 1.1.0  │                 │                            │
└────────────────────────────┘                 └────────────────────────────┘
         │                                              ▲
         │  Skill is invoked from one of:              │
         ▼                                              │ Reads Sheet via gws
┌───────────────────────────────────────────────────────┤
│  Any repo whose name appears in Sheet column C        │
│  (resolved at runtime; no hardcoded whitelist)        │
│                                                        │
│  Skill writes: docs/functional/<canonical-id>/         │
│                README.md  (and NN-<child-slug>.md      │
│                for parent's children)                  │
└────────────────────────────────────────────────────────┘
```

The skill's runtime dependency graph is: `gws` CLI (Sheet reads) · `git` +
`gh` (repo verification, optional commit) · `superpowers:brainstorming` (draft
pressure-test). No other external deps.

---

## Template evolution

Before the template moves, it must be updated to the new **folder-per-canonical-ID
with README.md** convention. Today's template documents three shapes with three
different file paths:

| Shape | Old path pattern | New path pattern |
| --- | --- | --- |
| Standalone | `<category>/<slug>.md` | `<canonical-id>/README.md` |
| Parent | `<category>/<slug>.md` + sibling folder `<category>/<slug>/` | `<canonical-id>/README.md` + sibling `NN-<child-slug>.md` files |
| Child | `<category>/<parent-slug>/NN-<child-slug>.md` | `NN-<child-slug>.md` inside parent's folder |

The category folder disappears — the folder is now always `<canonical-id>`.
Category information lives only in the Sheet (column D), not on disk. Every
flow gets its own folder; single-file flows (standalone, child) simply have no
siblings.

The template's "File layout" and "Three flow shapes" sections are the ones that
need rewording. The frontmatter conventions (id, title, parent, sub-flows,
renamed-from, absorbs, persona, last-reviewed) stay unchanged.

This template evolution lands in `vd-specs-product-architecture` as its own
commit, **before** the `git mv` into the engineering-skills plugin, so the
diff-audit history of the template stays inside the architecture repo.

---

## Skill structure

```text
skills/authoring-flow-spec/
├── SKILL.md                                      # workflow contract (~150 lines)
└── references/
    ├── flow-spec-template.md                     # moved from vd-specs-*
    ├── flow-spec-template-rationalization.md     # moved from vd-specs-*
    ├── sheet-interop.md                          # gws read patterns
    └── writing-the-draft.md                      # altitude test applied
```

### SKILL.md frontmatter

```yaml
---
name: authoring-flow-spec
description: >-
  Authors a top-level, behavior-focused user-flow specification from a canonical
  ID in the Vibedata User-Flows-Details Sheet, writing the result to
  <repo>/docs/functional/<Canonical ID>/README.md.
  Triggers on: flow spec, flow specification, functional spec, PRD, product
  requirements, user flow, behavior spec, journey map, draft a flow, author a
  flow, write a flow.
version: 0.1.0
---
```

### SKILL.md body outline

- `## When to use this` — scope boundary (flow-spec altitude only; not design
  spec, not FRD, not PRD). Explicit decision tree: if author asks for a design
  spec, skill redirects and still produces a flow spec with the design concerns
  called out as downstream work.
- `## Prerequisites` — `gws` installed and logged in; cwd inside one of the 4
  target repos; canonical ID exists in Sheet (or user has scheduled to add it).
- `## Workflow` — the 9 numbered phases (below).
- `## Cross-skill handoffs`:
  - `superpowers:brainstorming` — pressure-test the draft (Phase 7).
  - `superpowers:verification-before-completion` — before declaring the spec
    complete, confirm all placeholders resolved.
  - `engineering-skills:raising-linear-pr` — suggested next step if the flow
    spec completes implementation work that's tracked in a Linear issue.
- `## References` — pointers to the four files under `references/`.
- `## Out of scope` — exact list from the Non-goals section above.

### References/

- **flow-spec-template.md** — the relocated template with the folder-per-ID
  file-layout convention applied. Source of truth for structure.
- **flow-spec-template-rationalization.md** — the relocated rationalization
  doc. Human-oriented; explains the template's design decisions. Not read by
  the skill runtime; loaded only when a future maintainer edits the skill.
- **sheet-interop.md** — concrete `gws` commands for: looking up a canonical
  ID, reading the `repo`/`category`/`title`/`persona` columns, listing
  candidate IDs for a given repo. Every command shown with the exact
  `--params` JSON and expected output shape.
- **writing-the-draft.md** — how to apply the template in practice: the
  altitude test (from the template's authoring prompt), the "must NOT document"
  list, the three legitimate-cite exception classes, the business-rules-vs-
  invariants distinction, the events/observability kind-level rule. Skill
  agents consult this file during Phase 6 (scaffold) and Phase 8 (self-review).

---

## Skill workflow (10 phases)

### Phase 0 — Precondition check

- `command -v gws` resolves.
- `gws auth status` confirms an active login. If expired/missing → abort with
  the exact re-auth command.
- Inside a git repo (`git rev-parse --is-inside-work-tree`).
- Parse repo name from `git remote get-url origin`. Run the dynamic
  target-repo resolver from `skills/authoring-flow-spec/references/sheet-interop.md`
  §4 to fetch the unique non-empty values from Sheet column C; cache the set
  for the rest of the invocation (Phase 3 reuses it without re-fetching).
  Compare trimmed and case-folded; preserve the original Sheet casing in any
  user-facing message. If the resolver returns zero values, hard-abort
  ("Sheet column C is empty or has drifted"). If the parsed repo is not in
  the resolved set, abort and print the dynamic list as the legitimate
  options.

### Phase 1 — Identify the canonical ID

- If the author passed an ID via `/author-flow-spec <id>` or natural-language
  input, use it.
- Else ask: *"Which canonical ID are you authoring?"*
- If the author cannot name it, offer to list candidate IDs for the current
  repo by querying Sheet column B where column C matches the current repo.
  Present the list; author picks.

### Phase 2 — Fetch Sheet row

- `gws sheets spreadsheets values get` on `Flow Inventory!A:M`, filter to the
  matching canonical ID.
- Extract `repo` (C), `category` (D), `title` (E), `persona` (K).
- **Do not fetch `status`.** The skill never writes back; status is not part
  of the draft frontmatter (category encodes on-disk via Sheet, not
  frontmatter; status likewise).
- If no match on the canonical ID: this may be a child flow (composite ID).
  Proceed to Phase 2a.

### Phase 2a — Child-flow inference (only if Phase 2 returns no row)

- Attempt longest-prefix match against Sheet column B to locate the parent.
  Assumption — parent canonical IDs never collide on prefix (confirmed by
  ss@acceleratedata.ai during design).
- If parent found: the current ID is presumed to be `<parent>-<child-slug>`.
- If no parent found: abort with instructions to add a Sheet row first.

### Phase 3 — Verify repo alignment

- Compare the current repo name (from Phase 0) to the Sheet's column C (for a
  parent/standalone) or the parent's column C (for a child).
- Reuse the cached repo set from Phase 0; do not re-fetch.
- Compare trimmed and case-folded, consistent with Phase 0.
- Mismatch → abort with the message *"You are in `<current>` but flow `<id>`
  targets `<sheet-repo>`. Re-run this skill from the correct repo."*

### Sheet-driven repo set

The skill treats Sheet column C as the single source of truth for which
repos are legitimate authoring targets. The implementation contract:

- **Resolver location.** The recipe is in
  `skills/authoring-flow-spec/references/sheet-interop.md` §4.
- **Cache scope.** The resolver is called exactly once per skill invocation
  (Phase 0). The result is held in working memory and reused by Phase 3.
- **Empty-Sheet behavior.** If the resolver returns zero values after
  filtering (`#N/A`, blank, `pending …`), the skill hard-aborts. The same
  Sheet is the source of truth for canonical-ID lookup, so proceeding makes
  no sense.
- **Comparison semantics.** Both Phase 0 and Phase 3 compare trimmed,
  case-folded values. User-facing messages preserve the original Sheet
  casing.
- **No hardcoded whitelist.** Adding, renaming, or removing a target repo
  is a Sheet edit only — no skill, command, reference, design, or plan
  change is required.

This subsection codifies the change captured in
`docs/plan/2026-04-28-sheet-driven-target-repos.md`. It supersedes any
narrative in this design that previously enumerated four specific repo
names as the authoritative set.

### Phase 4 — Check for existing spec

- Target path (parent/standalone): `<repo-root>/docs/functional/<canonical-id>/README.md`
- Target path (child): `<repo-root>/docs/functional/<parent-id>/NN-<child-slug>.md`
  where `NN` is derived from the child's position in the parent's `sub-flows:`
  frontmatter list.
- If the file exists → read it; ask the author: *"Spec already exists. Update
  in place (preserve closed sections, re-run brainstorming on open ones), or
  abort?"*
- If it does not exist → proceed to draft.
- **Child-authoring precondition:** when authoring a child, the parent's
  `README.md` **must** already exist at `<repo-root>/docs/functional/<parent-id>/README.md`,
  and the child's composite ID must appear in the parent's `sub-flows:`
  frontmatter list. If either is missing, abort with *"Author the parent flow
  `<parent-id>` first (and add `<child-id>` to its `sub-flows:` list)."*

### Phase 5 — Gather reference material

Before drafting, the skill asks the author what existing context should
shape the spec:

> *"Before I draft, are there any existing documents I should read?
> For example: prior flow specs (same repo or archived under
> `vd-specs-product-architecture/user-flows/_archive/flows/`), design
> docs or architecture proposals, Linear issues, Granola meeting
> transcripts, Google Docs or Sheets with PRD / requirement context,
> or existing code that implements part of the behavior."*

The skill accepts any combination of:

- File paths (reads via `Read`).
- Linear issue IDs (via `mcp__claude_ai_Linear__get_issue`).
- Granola meeting IDs / titles (via `mcp__claude_ai_Granola__*`).
- Google Doc / Sheet IDs (via `gws docs documents get`,
  `gws sheets spreadsheets values get`).
- URLs (via `mcp__read-website-fast__read_website`; `WebFetch` fallback).
- *"None"* — proceed to Phase 6 with no added material.

For each source, the skill extracts only behaviorally-relevant content
(no implementation detail, UI copy, or retry mechanics) and builds a
short internal digest (4–8 bullets). That digest feeds Phase 6's
scaffold and frames Phase 7's brainstorming arc. The draft paraphrases
into behavioral language — it never copies verbatim prose.

### Phase 6 — Draft the scaffold

- Load `references/flow-spec-template.md`.
- Decide shape (standalone / parent / child) from Phase 2 + 2a signals + any
  author input about sub-flows.
- Emit frontmatter:
  - `id` — canonical ID (composite for child)
  - `title` — from Sheet column E (or author-provided for child)
  - `persona` — from Sheet column K
  - `parent` — only if child
  - `sub-flows:` — empty list for parent (author fills during brainstorming);
    omitted for standalone/child
  - `last-reviewed: <today>`
- Emit all required template sections with short placeholder prompts
  (e.g., `[describe the goal]`) that Phase 7 will close out. Incorporate
  the Phase 5 reference-material digest: any behavioral signal the digest
  captured should appear as a populated section (not a placeholder) or
  as a tagged Open Question.

### Phase 7 — Hand off to `superpowers:brainstorming`

- Invoke `Skill("superpowers:brainstorming")` with context:
  > *"The draft flow spec lives at `<path>`. Pressure-test it section by
  > section. The altitude rules and authoring prompt are in
  > `references/flow-spec-template.md`; honor them. Use the typical
  > brainstorming arc: summarize model in 4-6 bullets → enumerate Open
  > Questions → ask one at a time, edit draft inline after each answer."*
- Wait for brainstorming to return control.

### Phase 8 — Self-review

- Scan for placeholders (`TBD`, `TODO`, `[describe…]`).
- Check internal consistency: do Main flow steps and Success outcome align?
  Do Business rules contradict Invariants?
- Apply the altitude test to each paragraph per
  `references/writing-the-draft.md`. Flag altitude violations.
- Check that any cited signal name, label string, or event name falls into
  one of the three legitimate-cite classes (existing production artifacts,
  canonical sibling flow IDs, pre-existing cited artifacts). Cut or caveat
  anything else.
- Confirm design-phase Open Questions are tagged `[design]` and behavioral
  Open Questions are either resolved or have a specific resolution path.
- Apply fixes inline. Single pass; do not re-loop.

### Phase 9 — Write output and offer commit

- `mkdir -p <repo-root>/docs/functional/<canonical-id>/` (or
  `<parent-id>/` for child).
- Write the file.
- Print summary: canonical ID, target path, sections populated, Open Questions
  remaining, and the reminder that the Sheet's Filename hyperlink updates
  automatically once the pre-work formula change is applied.
- Prompt: *"Commit now? (y = commit with suggested message / n = skip / show =
  show the message first)"*
- If `y`: `git add <path> && git commit -m "docs(functional): author flow spec
  for <canonical-id>"` via heredoc for clean formatting. No `git push`.

### Safety rails (woven across phases)

- Skill refuses to specify event names, payload schemas, label strings, or
  UI details. Cites the template's *"must NOT document"* list.
- Skill refuses to write anywhere other than
  `docs/functional/<canonical-id>/README.md` (or `NN-<child-slug>.md`).
- Skill refuses to run outside the 4 target repos (Phase 0 gate).
- If `gws` auth fails mid-workflow (e.g., token expires between Phase 0 and
  Phase 2), skill surfaces the exact re-auth command and suggests resuming.

---

## Command shape

### `commands/author-flow-spec.md`

Thin wrapper, ~20 lines. Imperative-verb naming matches the convention in
`vd-specs-product-architecture/docs/design/agents/README.md`:

```markdown
---
description: Author a behavior-focused user-flow spec from a canonical ID. Thin wrapper around the authoring-flow-spec skill.
---

# /author-flow-spec

Invoke the `authoring-flow-spec` skill to author (or update) a user-flow
specification.

## Usage

- `/author-flow-spec <canonical-id>` — author the flow with the given
  canonical ID (e.g., `/author-flow-spec intent-user-data-mart-build`).
- `/author-flow-spec` — invoke the skill with no ID; the skill will ask.

## What this does

Delegates to `Skill("authoring-flow-spec")`. See
`skills/authoring-flow-spec/SKILL.md` for the full behavior contract.
```

Positional-only argument (no flags). Matches the `/init`, `/review`, `/deploy`
shape called out in the agent-primitives convention.

---

## Pre-work in `vd-specs-product-architecture`

All pre-work lands in the `feature/relocate-flow-specs` branch in
`vd-specs-product-architecture`, as a sequence of focused commits:

### Commit A — archive existing flows

`git mv` each real flow file into `user-flows/_archive/flows/<category>/`
preserving category subfolders:

- `user-flows/flows/intent/back-of-napkin.md`
  → `user-flows/_archive/flows/intent/back-of-napkin.md`
- `user-flows/flows/intent/intent-user-data-mart-build.md`
  → `user-flows/_archive/flows/intent/intent-user-data-mart-build.md`
- `user-flows/flows/intent/intent-user-data-mart-build/**` (18 files)
  → `user-flows/_archive/flows/intent/intent-user-data-mart-build/**`
- `user-flows/flows/context-management/ctx-issue-retro-agent.md`
  → `user-flows/_archive/flows/context-management/ctx-issue-retro-agent.md`
- `user-flows/flows/operate/pipeline-operate-triage-agent.md`
  → `user-flows/_archive/flows/operate/pipeline-operate-triage-agent.md`

### Commit B — update template to folder-per-ID convention

Rewrite `_flow-spec-template.md` "Three flow shapes", "File layout", and
frontmatter example sections to reflect the new on-disk layout. No relocation
yet — only content edits. Matching edits in
`_flow-spec-template-rationalization-2026-04-22.md` where it references the
old layout.

### Commit C — remove empty scaffolding

- Delete all `.gitkeep` files under `user-flows/flows/<category>/` for the 7
  empty category folders (app, data-mart-build, domain-ci-cd, ingestion,
  installation, onboarding, skills-plugins).
- Delete any committed `.DS_Store` files.
- `rmdir` the now-empty **category subfolders only**. Do not `rmdir`
  `user-flows/flows/` at this point — the two template files still live there.
  Final cleanup happens in Commit D.

### Commit D — move template files out

`git rm` both template files from `user-flows/flows/` (the engineering-skills
repo will contain the new copies):

- `user-flows/flows/_flow-spec-template.md`
- `user-flows/flows/_flow-spec-template-rationalization-2026-04-22.md`

At this point `user-flows/flows/` is fully empty and can be `rmdir`'d.

### Commit E — rule updates

**`.claude/rules/user-flows-sheet-sync.md`** — rule updates:

- "Flow-spec file layout" section: replace the three-path layout with the
  new folder-per-canonical-ID + README.md + `NN-<child-slug>.md` layout.
- Rewrite the broken relative link to `_flow-spec-template.md`. New pointer:
  *"Template and authoring workflow live in the `authoring-flow-spec` skill
  in the engineering-skills plugin. See that skill's SKILL.md for the
  authoring procedure."*
- **Filename HYPERLINK formula (column L)** — replace the hardcoded
  `vd-specs-product-architecture/…/user-flows/flows/<category>/<id>.md`
  pattern with a formula that uses column C (`repo`). See new formula below.
- Drop the `category_slug_map` helper and the Z:AA hidden columns it
  referenced — category is no longer used in the filename path.

New column L formula:

```text
=IF(OR(ISBLANK(C{row}), C{row}="#N/A"),
    "pending repo assignment",
    HYPERLINK(
      "https://github.com/accelerate-data/" & C{row} & "/blob/main/docs/functional/" & B{row} & "/README.md",
      "docs/functional/" & B{row} & "/README.md"
    ))
```

Guards against `#N/A`, blank, or `pending …` `repo` values (some target
repos may be nascent and intentionally have `#N/A` until a row is finalized).
The same filter rules apply to the Phase 0 dynamic resolver in
`references/sheet-interop.md` §4 — both Sheet-column-C consumers (per-row
extraction and the Phase 0 unique-set resolver) honor identical filters.

**`user-flows/CLAUDE.md`** — rule updates:

- Replace the reference to `moai-workflow-spec` skill with a pointer to the
  `authoring-flow-spec` skill in the engineering-skills plugin.
- Clarify that flow specs no longer live in `vd-specs-product-architecture`;
  the rules here cover changelog discipline only.

**`user-flows/status/README.md`** — README updates:

- Add a new section **"Authoring a flow spec"** between the
  *Linear Tagging* section (line 38) and the *Ownership* section (line 42),
  preceded by the existing `---` horizontal rule after Linear Tagging and
  followed by a new `---` before Ownership.
- The inserted section mirrors the tone and structure of the existing
  *"How to Update Your Status"* section (brief intro → "How to run" bullets
  → "What it does" numbered list → pointer to skill).

Exact markdown to insert:

```markdown
## Authoring a Flow Spec

Flow specs no longer live in this repo. They now live in each flow's
target GitHub repo (per the `repo` column in the User-Flows-Details Sheet)
at `docs/functional/<Canonical ID>/README.md`.

Use the `authoring-flow-spec` skill in the
[engineering-skills plugin](https://github.com/accelerate-data/engineering-skills)
to author or update a flow spec. It reads the Sheet, verifies you are in
the right repo, drafts from the canonical template, pressure-tests the
draft via the superpowers brainstorming skill, and writes the result to
the correct path.

**How to run:**

- Command fallback: `/author-flow-spec <canonical-id>` (positional).
- Natural-language triggers also fire the skill — e.g.
  *"draft a flow spec for <id>"*, *"write a PRD for <id>"*,
  *"author the functional spec for <id>"*.

**What it does:**

1. Confirms `gws` is logged in and you are inside one of the target repos
   listed in column C of the User-Flows-Details Sheet (resolved at runtime
   per `references/sheet-interop.md` §4 — no hardcoded whitelist).
2. Looks up the canonical ID in the Sheet for `repo`, `category`, `title`,
   and `persona`.
3. Verifies the repo you are in matches the Sheet's `repo` column.
4. Drafts the spec against the bundled flow-spec template.
5. Hands off to `superpowers:brainstorming` to pressure-test the draft
   section by section.
6. Writes to `<repo>/docs/functional/<canonical-id>/README.md` — or
   `NN-<child-slug>.md` if the ID is a child composite.
7. Offers to commit; you decide when.

For the full behavior contract, see the
[`authoring-flow-spec`](https://github.com/accelerate-data/engineering-skills/tree/main/skills/authoring-flow-spec)
skill.
```

After insertion, the section order in `status/README.md` becomes: Objective →
Status Definitions → Linear Tagging → **Authoring a Flow Spec** (new) →
Ownership → How to Update Your Status → Rules → Commands → Canonical source →
Files → Changelog rule → Scope.

### Commit F — changelog

Append an entry dated `2026-04-24` to `user-flows/_changelog.md`:

> Archived all 22 flow files to `_archive/flows/`. Removed `user-flows/flows/`
> directory. Relocated `_flow-spec-template.md` and its rationalization
> document to the `authoring-flow-spec` skill in the engineering-skills
> plugin. Updated `.claude/rules/user-flows-sheet-sync.md`, `user-flows/CLAUDE.md`,
> and `user-flows/status/README.md` to point at the new skill. Updated Sheet
> column L HYPERLINK formula to use column C (`repo`).

No entry needed in `user-flows/status/_changelog.md` — this is a structural
change, not a status or ownership change.

### Sheet schema change (out of git, applied via `gws`)

Apply the new HYPERLINK formula to column L across all existing rows, using
`gws sheets spreadsheets batchUpdate`. Verify the `#N/A` guard by spot-checking
a row whose column C currently holds `#N/A`. No other columns change.

---

## Engineering-skills housekeeping

### Repo-level metadata

- `AGENTS.md` "Skills" section — add:

```text
- `skills/authoring-flow-spec/SKILL.md` - author a Vibedata user-flow
  specification from a canonical ID
```

- `README.md` "Current Skills" table — add:

```text
| [`authoring-flow-spec`](./skills/authoring-flow-spec) | Author a
behavior-focused Vibedata user-flow spec from a canonical ID in the
User-Flows-Details Sheet; writes to the target repo's
`docs/functional/<id>/README.md`. |
```

- `repo-map.json` — add an entry for the new skill alongside the existing
  ones (structure matches the existing format).

### Plugin version bump

`.claude-plugin/plugin.json`: `"version": "1.0.6"` → `"1.1.0"`. Same for
`.codex-plugin/plugin.json` if it declares a version. The
`version-bump-check.yml` GitHub Action should confirm the bump.

### Markdownlint

All new `.md` files (SKILL.md, command, four references) must pass
`markdownlint` before commit. Per `AGENTS.md`: *"All `.md` files should pass
`markdownlint` before committing."*

---

## Files changed

### `ad-plugins/engineering-skills` (branch `feature/authoring-flow-spec`)

| File | Change |
|---|---|
| `skills/authoring-flow-spec/SKILL.md` | **New** — workflow contract |
| `skills/authoring-flow-spec/references/flow-spec-template.md` | **New** — moved from vd-specs-*, folder-per-ID layout |
| `skills/authoring-flow-spec/references/flow-spec-template-rationalization.md` | **New** — moved from vd-specs-* |
| `skills/authoring-flow-spec/references/sheet-interop.md` | **New** — `gws` patterns |
| `skills/authoring-flow-spec/references/writing-the-draft.md` | **New** — altitude test + discipline |
| `commands/author-flow-spec.md` | **New** — thin command wrapper |
| `AGENTS.md` | Add skill entry to Skills section |
| `README.md` | Add row to Current Skills table |
| `repo-map.json` | Add skill entry |
| `.claude-plugin/plugin.json` | Version bump 1.0.6 → 1.1.0 |
| `.codex-plugin/plugin.json` | Version bump (if applicable) |
| `docs/superpowers/specs/2026-04-24-authoring-flow-spec-design.md` | **New** — this document |

### `vd-specs-product-architecture` (branch `feature/relocate-flow-specs`)

| File | Change |
|---|---|
| `user-flows/flows/**/*.md` (22 files) | `git mv` → `user-flows/_archive/flows/**` |
| `user-flows/flows/_flow-spec-template.md` | `git rm` (moved to engineering-skills) |
| `user-flows/flows/_flow-spec-template-rationalization-2026-04-22.md` | `git rm` (moved to engineering-skills) |
| `user-flows/flows/**/.gitkeep` | `git rm` (7 files) |
| `user-flows/flows/**/.DS_Store` | `git rm` (if tracked) |
| `user-flows/flows/` directory | `rmdir` (after emptied) |
| `.claude/rules/user-flows-sheet-sync.md` | Path layout + HYPERLINK formula rewrite |
| `user-flows/CLAUDE.md` | Replace moai-workflow-spec reference with authoring-flow-spec pointer |
| `user-flows/status/README.md` | Add "Authoring a flow spec" section |
| `user-flows/_changelog.md` | Append 2026-04-24 entry |

### Google Sheet (`1nq0ab_E6sAjxR7WgihsF92CGfRzj7lCe3Z3GQSu25kA`)

| Change | Method |
|---|---|
| Column L HYPERLINK formula — use col C, add `#N/A` guard | `gws sheets spreadsheets batchUpdate` |
| Hidden helper cols Z:AA (`category_slug_map`) — drop | `gws sheets spreadsheets batchUpdate` |

---

## Risks and caveats

- **Template git-history discontinuity.** `git mv` across repo boundaries is
  not a single operation — the template's history ends in
  `vd-specs-product-architecture` and starts fresh in `engineering-skills`.
  `git log --follow` works within each repo. Worth a short note in the
  engineering-skills commit that relocates the files: *"Moved from
  `vd-specs-product-architecture/user-flows/flows/`, history preserved there."*
- **Sheet formula error propagation.** The new HYPERLINK formula references
  column C. Any row with `#N/A` or blank C renders as *"pending repo
  assignment"* rather than a broken link, but any row with a non-enum value
  in C (typo, legacy value) will render a broken URL. The Sheet schema should
  keep data validation on column C to the four-repo enum.
- **`gws` token expiry mid-workflow.** Phase 0 catches this at start, but a
  long brainstorming session in Phase 7 could outlive the token. If Phase 9
  fails on `gws` re-read (there shouldn't be one, but defensively), the skill
  surfaces the exact re-auth command — no silent retry loops.
- **Orphaned references.** Any document outside the two repos touched here
  that links to the old
  `vd-specs-product-architecture/user-flows/flows/<category>/<slug>.md` paths
  will 404 after the archive. Search the organization for these before
  merging. (Known candidates: Linear issue bodies, Granola meeting notes.)
- **First skill in this plugin with a `commands/` directory.** The
  engineering-skills repo has no top-level `commands/` today. We are creating
  it. Other AD plugins (`content-skills`) already have this pattern, so it
  does not violate any convention, but the plugin manifest may need a
  one-line check that commands auto-register.
- **Cross-repo merge ordering.** The engineering-skills branch
  (`feature/authoring-flow-spec`) must merge **before** the
  `vd-specs-product-architecture` branch's Commit D (which removes the template
  files). Merging D first leaves a window where the template exists nowhere on
  any main branch. Recommended sequence:
  1. Merge `feature/authoring-flow-spec` into `engineering-skills/main`.
  2. Cut the plugin release (`1.1.0`) and propagate to the marketplace.
  3. Merge `feature/relocate-flow-specs` into
     `vd-specs-product-architecture/main`.
  4. Apply the Sheet batchUpdate for the HYPERLINK formula.

---

## Success criteria

1. A developer in any repo listed in Sheet column C can run
   `/author-flow-spec <canonical-id>` and, within one brainstorming session,
   produce a committed `docs/functional/<id>/README.md` that passes the
   template's altitude test with no manual template lookups.
2. Natural-language triggers ("draft a flow spec for X", "write a PRD for X",
   "author the functional spec for X") all invoke the skill without the
   developer naming the skill.
3. `gws sheets spreadsheets values get` on the Sheet's column L returns a
   working GitHub URL for every row where column C is one of the four-repo
   enum values; rows with `#N/A` in C render *"pending repo assignment"*.
4. `user-flows/flows/` directory no longer exists in
   `vd-specs-product-architecture` after merge.
5. A grep for `_flow-spec-template.md` or `moai-workflow-spec` across
   `vd-specs-product-architecture` returns zero hits after merge (all
   references point at the new skill).
6. Plugin marketplace update (separate operation) picks up engineering-skills
   `1.1.0` and the new skill + command surface to end-user tooling.

---

## Open items (deferred, tracked separately)

- **Promptfoo eval coverage** for `authoring-flow-spec`. Deferred until the
  skill has baked through real usage and actual failure modes are visible.
  Follow-up: add `tests/evals/packages/authoring-flow-spec/` with at least
  three scenarios (standalone, parent, child).
- **Re-authoring of archived flows** into their target repos. Each of the 4
  parent/standalone flows + their children needs a separate `/author-flow-spec`
  invocation. Owners decide when.
- **Sheet hyperlink on child rows.** Children do not get Sheet rows today (per
  `.claude/rules/user-flows-sheet-sync.md`). If that rule ever reverses, the
  HYPERLINK formula will need an "if child" branch that targets
  `NN-<child-slug>.md` rather than `README.md`. Out of scope for this spec.
