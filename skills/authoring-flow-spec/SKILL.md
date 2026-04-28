---
name: authoring-flow-spec
description: >-
  Use when the user asks to write, draft, author, create, update, or review a
  behavior-focused user flow, flow spec, functional spec, PRD, product
  requirements doc, journey map, or canonical flow specification. Do NOT
  invoke for implementation plans, design specs, or PRDs with market
  positioning — those are downstream artifacts that link back to the flow
  spec, not the flow spec itself.
version: 0.1.0
---

# Authoring a Vibedata Flow Spec

## When to use this

Use this skill when authoring or updating a **top-level, behavior-focused user-flow specification** for a Vibedata flow. The output is the source-of-truth artifact. Downstream functional specs, design specs, and implementation plans link back to this one — not the other way around.

This skill is **not** for:

- Design specs (mockups, component structure, copy, styling)
- Functional specs (explicit event names, payload schemas, retry policies)
- Implementation plans (file paths, class names, migration steps)
- PRDs (market positioning, business case)

If the user asks for any of the above, redirect: the flow spec is a prerequisite for all of them. Produce the flow spec first; the downstream artifacts link to it later.

## Prerequisites

Before invoking the skill, confirm:

- `gws` CLI is installed and logged in (`gws auth status` exits zero).
- Current working directory is inside a git checkout of one of the target repos listed in column C of the User-Flows-Details Sheet. The skill resolves this list at runtime per `references/sheet-interop.md` §4 — there is no hardcoded list.
- The flow's canonical ID exists as a row in the User-Flows-Details Sheet (or the author has scheduled to add it per `vd-specs-product-architecture/.claude/rules/user-flows-sheet-sync.md`).

## Workflow

### Phase 0 — Precondition check

1. Verify `command -v gws` resolves.
2. Run `gws auth status`. If non-zero, abort with:

   > Run `gws auth login` first, then retry.

3. Verify `git rev-parse --is-inside-work-tree` exits zero.
4. Parse `git remote get-url origin` to extract the repo name (everything after the last `/`, stripping `.git`). Run the resolver from `references/sheet-interop.md` §4 to fetch the unique non-empty values in Sheet column C; cache that set for the rest of the invocation (do not re-fetch in Phase 3). Trim and case-fold both sides before comparing. The Sheet value's original casing is preserved for any user-facing message.

   - If the resolver returns zero values, abort with:

     > Sheet column C is empty or has drifted. Verify the User-Flows-Details schema before retrying.

   - If the current repo is not in the resolved set, abort with:

     > Current repo `<current-repo>` is not listed in Sheet column C. Legitimate options (from the Sheet): `<comma-separated-resolved-list>`. Re-run from one of those, or add a row to the Sheet first.

5. Confirm the required cross-skill handoffs are available through the runtime's skill/tool registry before drafting:

   - `superpowers:brainstorming`
   - `superpowers:verification-before-completion`

   Do not rely on local filesystem paths alone; use the runtime's skill availability mechanism so the check reflects what can actually be invoked.
   If either skill is unavailable, abort before creating or modifying the flow spec and report the missing skill names.

### Phase 1 — Identify the canonical ID

- If the invocation passed an ID (e.g., `/author-flow-spec intent-user-data-mart-build`),
  use it.
- Otherwise ask: *"Which canonical ID are you authoring?"*
- If the author cannot name one, use the pattern from `references/sheet-interop.md` to list candidate IDs for the current repo,
  then let them pick.

### Phase 2 — Fetch Sheet row

Run the `values get` command from `references/sheet-interop.md` to fetch the row matching the canonical ID. Extract columns:

- `B` = canonical ID
- `C` = `repo` (target repo name)
- `D` = `category`
- `E` = `title`
- `K` = `persona`

Do NOT read column H (`status`); the skill never writes back to the Sheet.

If no row matches, proceed to Phase 2a.

### Phase 2a — Child-flow inference

Attempt a longest-prefix match of the candidate ID against column B across all rows. If a prefix match is found, the candidate is a child of that parent.
Parent prefix collisions are assumed impossible (design-time assumption from the spec author).

If no parent prefix matches, abort with:

> No row found for `<id>` and no parent prefix match. Add a row to the Sheet
> first (see `.claude/rules/user-flows-sheet-sync.md`) or verify the ID
> spelling.

### Phase 3 — Verify repo alignment

Compare the current repo name from Phase 0 to the Sheet's column C (for a parent/standalone) or the parent's column C (for a child). Use the cached repo set from Phase 0 — do not re-fetch. Compare trimmed and case-folded, consistent with Phase 0. If they differ, abort:

> You are in `<current-repo>` but flow `<id>` targets `<sheet-repo>`. Re-run
> this skill from the correct repo.

### Phase 4 — Check for existing spec

- **Parent/standalone target path:** `<repo-root>/docs/functional/<canonical-id>/README.md`
- **Child target path:** `<repo-root>/docs/functional/<parent-id>/NN-<child-slug>.md`, where `NN`
  is the child's 1-indexed position (zero-padded to two digits) in the parent's `sub-flows:` frontmatter list.

**Child-authoring precondition:** the parent's `README.md` **must** already exist at `<repo-root>/docs/functional/<parent-id>/README.md`, AND the child's composite ID must appear in that README's `sub-flows:` list. If either is missing, abort:

> Author the parent flow `<parent-id>` first (and add `<child-id>` to its
> `sub-flows:` list).

If the target file already exists, read it and ask the author:

> Spec already exists. Update in place (preserve closed sections, re-run
> brainstorming on open ones), or abort?

Otherwise, proceed to draft.

### Phase 5 — Gather reference material

Before drafting, ask the author what existing context should shape the flow spec:

> *"Before I draft, are there any existing documents I should read? For
> example: prior flow specs (same repo or archived under*
> *`vd-specs-product-architecture/user-flows/_archive/flows/`), design*
> *docs or architecture proposals, Linear issues, Granola meeting*
> *transcripts, Google Docs or Sheets with PRD / requirement context, or*
> *existing code that implements part of the behavior."*

Collect whatever the author provides:

- **File paths** (inside any of the relevant repos) → `Read` them.
- **Linear issue IDs** (e.g., `VD-123`) → fetch via the Linear MCP tool available in your runtime.
- **Granola meeting IDs or titles** → fetch via the Granola MCP tool available in your runtime.
- **Google Doc / Sheet IDs** → fetch via the `gws` CLI (e.g.,
  `gws docs documents get`, `gws sheets spreadsheets values get`).
- **URLs (GitHub, public web)** → fetch via `mcp__read-website-fast__read_website` (fall back to `WebFetch` on failure).
- **Nothing offered** → proceed to Phase 6 with no additional material.

For each source, extract only the content that shapes the behavioral spec — ignore implementation detail, UI copy, retry policies, and anything below the altitude line per
`references/writing-the-draft.md`. Build a short internal digest
(4–8 bullets) summarizing the behavioral signals found. Use the digest to populate Phase 6's scaffold and to frame Phase 7's brainstorming arc.

Do not copy verbatim prose into the draft. Paraphrase into behavioral language.

### Phase 6 — Draft the scaffold

Load `references/flow-spec-template.md` and `references/writing-the-draft.md`.
Decide shape from Phase 2 / 2a signals and any author input about sub-flows.

Emit frontmatter:

- `id`: the canonical ID (composite for a child).
- `title`: from Sheet column E (or author-provided for a child).
- `persona`: from Sheet column K.
- `parent`: only if this is a child.
- `sub-flows:`: empty list for a parent (author fills during brainstorming);
  omitted for standalone/child.
- `last-reviewed: <today's date>` (`date +%Y-%m-%d`).

Emit every required template section with short placeholder prompts
(e.g., `[describe the goal]`) that Phase 7 will close. Incorporate the
Phase 5 reference-material digest: any behavioral signal it captured should appear as a populated section (not a placeholder) or as a tagged
Open Question.

### Phase 7 — Hand off to `superpowers:brainstorming`

Invoke `Skill("superpowers:brainstorming")` with the following context:

> The draft flow spec lives at `<path>`. Pressure-test it section by section.
> The altitude rules and the authoring prompt are in
> `references/flow-spec-template.md`; honor them. Use the typical brainstorming
> arc: summarize the behavioral model in 4–6 bullets → enumerate Open
> Questions → ask one at a time, editing the draft inline after each answer.

Wait for brainstorming to return control before proceeding.

### Phase 8 — Self-review

Apply the altitude test per `references/writing-the-draft.md` to every paragraph. Check for:

- Placeholders: `TBD`, `TODO`, `[describe…]`.
- Internal contradictions: do Main flow steps and Success outcome align?
  Do Business rules contradict Invariants?
- Altitude violations: design detail that slipped in.
- Illegitimate name citations: anything outside the three legitimate-cite classes.
- Unresolved behavioral Open Questions: these must be either resolved or have a specific resolution path. Design-tagged (`[design]`) Open Questions may remain.

Fix inline. Single pass; do not re-loop.

### Phase 9 — Write output and offer commit

1. `mkdir -p <repo-root>/docs/functional/<canonical-id>/` (or `<parent-id>/`
   for a child).
2. Write the file to the target path.
3. Print a summary:
   - Canonical ID + target path
   - Sections populated
   - Open Questions remaining
   - Reminder that the Sheet's Filename hyperlink auto-updates once the
     pre-work formula change is applied.
4. Prompt:

   > Commit now? (y = commit with suggested message / n = skip / show =
   > show the message first)

5. On `y`, run:

   ```bash
   git add <path>
   git commit -m "docs(functional): author flow spec for <canonical-id>"
   ```

   No `git push`.

## Safety rails

The skill refuses the following, citing `references/flow-spec-template.md`:

- Specifying event names, payload schemas, label strings, or UI details.
- Writing to any path other than `docs/functional/<canonical-id>/README.md`
  or `NN-<child-slug>.md`.
- Running outside any repo listed in Sheet column C of the User-Flows-Details Sheet (the legitimate set is resolved at runtime — there is no hardcoded whitelist in this skill).
- Writing to any Sheet cell.

## Cross-skill handoffs

| When | Invoke |
|---|---|
| Phase 7 (pressure-test the draft) | `superpowers:brainstorming` |
| Before claiming the spec is complete | `superpowers:verification-before-completion` |
| Author asks to open a Linear PR after the spec lands | `engineering-skills:raising-linear-pr` |
| Author asks for the design spec or implementation plan | Redirect — those link back to the flow spec; produce the flow spec first |

## References

- `references/flow-spec-template.md` — canonical template, folder-per-ID layout. Loaded in Phase 6 (scaffold) and Phase 8 (self-review).
- `references/flow-spec-template-rationalization.md` — rationale behind the template's structure. Human-oriented; maintainers only.
- `references/sheet-interop.md` — `gws` command patterns for Phase 0 §4 (the dynamic target-repo resolver, used by the precondition guard and reused by Phase 3 alignment), Phase 1 §2 (candidate listing), Phase 2 §1 (row fetch), and any Google Doc / Sheet fetches surfaced by Phase 5 (reference gathering).
- `references/writing-the-draft.md` — altitude test, legitimate-cite classes, business-rules-vs-invariants distinction, events/observability kind-level rule.

## Out of scope

- Status updates. Use `update-flow-status` instead.
- Creating or updating Sheet rows. Follow `vd-specs-product-architecture/.claude/rules/user-flows-sheet-sync.md`
  manually.
- `git push`. The author pushes when ready.
- Migrating pre-existing flow specs from the archive to the target repos.
  Each migration is a separate invocation of this skill.
