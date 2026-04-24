# authoring-flow-spec Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a new `authoring-flow-spec` skill and `/author-flow-spec` command in `ad-plugins/engineering-skills` that owns the end-to-end authoring workflow for Vibedata user-flow specifications, and relocate the current template + archive existing flows in `vd-specs-product-architecture` so the skill becomes the single source of truth.

**Architecture:** Two repos in a strict sequence. In `vd-specs-product-architecture` (branch `feature/relocate-flow-specs`) archive existing flows and update the template to the new folder-per-canonical-ID + README.md convention. In `ad-plugins/engineering-skills` (branch `feature/authoring-flow-spec`, already has design spec committed) build the skill, pull in the updated template, add the command, register metadata, bump plugin version. Then return to `vd-specs-product-architecture` to remove the now-relocated templates, update dependent rules, update the Sheet HYPERLINK formula. Finally integration-test against a real target repo.

**Tech Stack:** Markdown (SKILL.md, references, command), JSON (plugin manifests, repo-map.json), `gws` CLI (Google Sheet interop), `gh` CLI (repo operations), `git` + `markdownlint` + `npm run eval:*` (validation), `superpowers:brainstorming` (skill composition).

---

## Scope Check

This plan spans two repositories. It is **not** split into separate plans because:

1. The template file physically moves from one repo to the other; there is a hard ordering dependency (`vd-specs-*` Phase A → engineering-skills Phase B → `vd-specs-*` Phase C).
2. The skill cannot ship a working template until `vd-specs-*` Phase A updates the template content.
3. The `vd-specs-*` cleanup (Phase C) cannot land until the skill contains the template.
4. Every task group below is idempotent and testable within the plan.

---

## File Structure

### Created files — `ad-plugins/engineering-skills`

| Path | Responsibility |
|---|---|
| `skills/authoring-flow-spec/SKILL.md` | Workflow contract: 9 phases, cross-skill handoffs, scope boundary |
| `skills/authoring-flow-spec/references/flow-spec-template.md` | Canonical flow-spec template (moved from vd-specs-*, updated to folder-per-ID layout) |
| `skills/authoring-flow-spec/references/flow-spec-template-rationalization.md` | Why the template is shaped this way (moved from vd-specs-*) |
| `skills/authoring-flow-spec/references/sheet-interop.md` | `gws` command patterns: canonical-ID lookup, row fetch, candidate listing |
| `skills/authoring-flow-spec/references/writing-the-draft.md` | Altitude test, legitimate-cite classes, business-rules-vs-invariants distinction |
| `commands/author-flow-spec.md` | Thin command wrapper for `/author-flow-spec <canonical-id>` |

### Modified files — `ad-plugins/engineering-skills`

| Path | Change |
|---|---|
| `AGENTS.md` | Add skill to Skills section |
| `README.md` | Add row to Current Skills table |
| `repo-map.json` | Add skill to modules.skills description; no new top-level entry needed |
| `.claude-plugin/plugin.json` | No version field today — design calls for 1.1.0 bump via the marketplace, leave this file untouched |

### Archived / moved files — `vd-specs-product-architecture`

| From | To | Method |
|---|---|---|
| `user-flows/flows/intent/back-of-napkin.md` | `user-flows/_archive/flows/intent/back-of-napkin.md` | `git mv` |
| `user-flows/flows/intent/intent-user-data-mart-build.md` | `user-flows/_archive/flows/intent/intent-user-data-mart-build.md` | `git mv` |
| `user-flows/flows/intent/intent-user-data-mart-build/` (18 child files) | `user-flows/_archive/flows/intent/intent-user-data-mart-build/` | `git mv` |
| `user-flows/flows/context-management/ctx-issue-retro-agent.md` | `user-flows/_archive/flows/context-management/ctx-issue-retro-agent.md` | `git mv` |
| `user-flows/flows/operate/pipeline-operate-triage-agent.md` | `user-flows/_archive/flows/operate/pipeline-operate-triage-agent.md` | `git mv` |
| `user-flows/flows/_flow-spec-template.md` | (content updated in place first, then copied to engineering-skills, then `git rm` here) | rewrite → copy → delete |
| `user-flows/flows/_flow-spec-template-rationalization-2026-04-22.md` | (copy to engineering-skills, then `git rm` here) | copy → delete |
| All `.gitkeep` files under `user-flows/flows/<category>/` | deleted | `git rm` |

### Modified files — `vd-specs-product-architecture`

| Path | Change |
|---|---|
| `.claude/rules/user-flows-sheet-sync.md` | Path layout rewrite, template link replacement, HYPERLINK formula replacement, drop `category_slug_map` helper |
| `user-flows/CLAUDE.md` | Replace `moai-workflow-spec` reference with `authoring-flow-spec` pointer |
| `user-flows/status/README.md` | Insert "Authoring a Flow Spec" section (exact content in Task C4) |
| `user-flows/_changelog.md` | Append 2026-04-24 entry |

### Google Sheet changes — `1nq0ab_E6sAjxR7WgihsF92CGfRzj7lCe3Z3GQSu25kA`

| Change | Method |
|---|---|
| Column L HYPERLINK formula rewrite (uses column C; `#N/A` guard) | `gws sheets spreadsheets batchUpdate` |
| Drop hidden helper columns Z:AA (`category_slug_map`) | `gws sheets spreadsheets batchUpdate` |

---

## Phase A — Pre-work in `vd-specs-product-architecture`

### Task A1: Create feature branch in `vd-specs-product-architecture`

**Files:** none yet — branch creation only.

- [ ] **Step 1: Verify clean working tree**

```bash
git -C /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture status --short
```

Expected: empty output (no uncommitted changes). If not empty, stop and resolve with the user before continuing.

- [ ] **Step 2: Fetch origin and create the feature branch**

```bash
git -C /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture fetch origin
git -C /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture checkout -b feature/relocate-flow-specs origin/main
```

Expected: `Switched to a new branch 'feature/relocate-flow-specs'`.

---

### Task A2: Commit A — archive existing flow files

**Files (all moves via `git mv`):**

- Move: `user-flows/flows/intent/back-of-napkin.md` → `user-flows/_archive/flows/intent/back-of-napkin.md`
- Move: `user-flows/flows/intent/intent-user-data-mart-build.md` → `user-flows/_archive/flows/intent/intent-user-data-mart-build.md`
- Move: `user-flows/flows/intent/intent-user-data-mart-build/*.md` (18 files) → `user-flows/_archive/flows/intent/intent-user-data-mart-build/*.md`
- Move: `user-flows/flows/context-management/ctx-issue-retro-agent.md` → `user-flows/_archive/flows/context-management/ctx-issue-retro-agent.md`
- Move: `user-flows/flows/operate/pipeline-operate-triage-agent.md` → `user-flows/_archive/flows/operate/pipeline-operate-triage-agent.md`

- [ ] **Step 1: Create archive destination directory tree**

```bash
cd /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture
mkdir -p user-flows/_archive/flows/intent/intent-user-data-mart-build
mkdir -p user-flows/_archive/flows/context-management
mkdir -p user-flows/_archive/flows/operate
```

- [ ] **Step 2: Move the two flat files under `intent/`**

```bash
git -C /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture mv \
  user-flows/flows/intent/back-of-napkin.md \
  user-flows/_archive/flows/intent/back-of-napkin.md

git -C /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture mv \
  user-flows/flows/intent/intent-user-data-mart-build.md \
  user-flows/_archive/flows/intent/intent-user-data-mart-build.md
```

- [ ] **Step 3: Move the 18 child files under `intent-user-data-mart-build/`**

```bash
for f in 01-intent-creation.md 02-requirements-gathering.md 03-design-document-creation.md \
         04-design-document-auto-review.md 05-design-document-user-approval.md \
         06-skill-advisory.md 07-source-schema-discovery.md 08-dbt-model-generation.md \
         09-dbt-test-generation.md 10-dbt-test-auto-review.md 11-dbt-run.md \
         12-build-wrapper-notebook.md 13-golden-data-validation.md 14-code-review-gate.md \
         15-dbt-contract-generation.md 16-dbt-semantic-model-generation.md \
         17-dbt-model-docs.md 18-dbt-project-docs.md; do
  git -C /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture mv \
    "user-flows/flows/intent/intent-user-data-mart-build/$f" \
    "user-flows/_archive/flows/intent/intent-user-data-mart-build/$f"
done
```

- [ ] **Step 4: Move the remaining two flat files**

```bash
git -C /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture mv \
  user-flows/flows/context-management/ctx-issue-retro-agent.md \
  user-flows/_archive/flows/context-management/ctx-issue-retro-agent.md

git -C /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture mv \
  user-flows/flows/operate/pipeline-operate-triage-agent.md \
  user-flows/_archive/flows/operate/pipeline-operate-triage-agent.md
```

- [ ] **Step 5: Verify all 22 files moved, none orphaned**

```bash
find /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture/user-flows/_archive/flows -type f -name "*.md" | wc -l
```

Expected: `22`.

```bash
find /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture/user-flows/flows -type f -name "*.md" 2>/dev/null
```

Expected: exactly 2 files (the template + rationalization doc) remain. No other `.md` files.

- [ ] **Step 6: Commit A**

```bash
git -C /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture add -A
git -C /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture commit -m "$(cat <<'EOF'
docs(flows): archive existing flow files to user-flows/_archive/

Moves 4 parent/standalone flow specs and 18 child specs to
user-flows/_archive/flows/ preserving category subfolders. Flows now live
in each target repo at docs/functional/<Canonical ID>/; these archived
copies preserve history for reference only and are not re-authored as
part of this change.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task A3: Commit B — update template to folder-per-canonical-ID convention

**Files:**

- Modify: `user-flows/flows/_flow-spec-template.md` — rewrite "Three flow shapes", "File layout", file-path examples, and the authoring prompt's "File location" section.
- Modify: `user-flows/flows/_flow-spec-template-rationalization-2026-04-22.md` — update any references to the old `<category>/<slug>.md` paths.

- [ ] **Step 1: Read the current template to locate the sections to change**

```bash
grep -n "Three flow shapes\|File layout\|File location\|user-flows/flows/" \
  /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture/user-flows/flows/_flow-spec-template.md
```

Note the line numbers — you'll need to edit these specific sections.

- [ ] **Step 2: Update the "Three flow shapes" table**

Replace the current three-shape table (around the current "File layout" section) with:

```markdown
## Three flow shapes

Every flow is one file. Its frontmatter and filesystem position tell you whether
it has a parent, or children, or neither. All three shapes use the **same
template**; one section flexes based on shape.

| Shape | Frontmatter marker | File path inside target repo |
| --- | --- | --- |
| **Standalone** | neither `parent:` nor `sub-flows:` | `docs/functional/<canonical-id>/README.md` |
| **Parent (has children)** | `sub-flows:` list | `docs/functional/<canonical-id>/README.md` |
| **Child (of a parent)** | `parent: <parent-slug>` | `docs/functional/<parent-id>/NN-<child-slug>.md` (inside parent's folder) |

Every canonical ID gets its own folder under `docs/functional/`. Standalones
have a single `README.md`. Parents have `README.md` + sibling `NN-<child-slug>.md`
child files. Children do not get their own folders — they live as siblings
beside the parent's `README.md`.
```

- [ ] **Step 3: Update the "File layout" illustration**

Replace the existing ASCII layout with:

```markdown
### File layout

\`\`\`text
<target-repo>/docs/functional/
├─ <standalone-canonical-id>/
│  └─ README.md
│
└─ <parent-canonical-id>/
   ├─ README.md                           ← parent flow spec
   ├─ 01-<first-child-slug>.md            ← child flow specs
   ├─ 02-<second-child-slug>.md
   └─ …
\`\`\`

Child filenames begin with a zero-padded sequence prefix (`01-`, `02-`, …).
The prefix encodes reading / phase order; it is **not** part of the canonical ID.
The child's canonical ID is still the composite `<parent-slug>-<child-slug>`.
```

(Note: the `text` code fence uses backslash-escaped backticks in this plan to
avoid nesting; when you write the actual template, use plain triple backticks.)

- [ ] **Step 4: Update the "File location" section inside the authoring prompt**

Replace the current file-location instructions with:

```markdown
> ### File location
>
> Write the spec to the target GitHub repo named in the User-Flows-Details
> Sheet's `repo` column:
>
> - Standalone or parent: `<repo>/docs/functional/<canonical-id>/README.md`
> - Child: `<repo>/docs/functional/<parent-id>/NN-<child-slug>.md`
>
> The canonical ID matches Sheet column B. The target repo (studio,
> skill-builder, domain-cicd, or migration-utility) is Sheet column C.
> Category (Sheet column D) is no longer encoded in the file path —
> it lives only in the Sheet.
```

- [ ] **Step 5: Sweep the rest of the template for stale `user-flows/flows/` path references**

```bash
grep -n "user-flows/flows" \
  /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture/user-flows/flows/_flow-spec-template.md
```

For each hit, update to the new `docs/functional/<canonical-id>/` pattern.
Typical locations: "Reference examples" section near the end, sidebar notes
inside the authoring prompt.

- [ ] **Step 6: Update `_flow-spec-template-rationalization-2026-04-22.md` to match**

```bash
grep -n "user-flows/flows\|<category>/<slug>" \
  /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture/user-flows/flows/_flow-spec-template-rationalization-2026-04-22.md
```

For each match, update to the folder-per-ID convention. Preserve the
historical "why this changed" rationale; this doc explains the evolution.

- [ ] **Step 7: Run markdownlint on both files**

```bash
markdownlint \
  /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture/user-flows/flows/_flow-spec-template.md \
  /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture/user-flows/flows/_flow-spec-template-rationalization-2026-04-22.md
```

Expected: clean exit (no output). If errors, fix inline before committing.

- [ ] **Step 8: Commit B**

```bash
git -C /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture add \
  user-flows/flows/_flow-spec-template.md \
  user-flows/flows/_flow-spec-template-rationalization-2026-04-22.md

git -C /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture commit -m "$(cat <<'EOF'
docs(flows): update template to folder-per-canonical-ID convention

Flows now live at <target-repo>/docs/functional/<canonical-id>/ — every
flow gets its own folder. Standalones have a single README.md. Parents
have README.md plus sibling NN-<child-slug>.md child files. Children no
longer get their own folders.

Category is dropped from the file path (it lives in Sheet col D only).
Target repo is Sheet col C.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task A4: Commit C — remove empty scaffolding

**Files:**

- Delete: `user-flows/flows/app/.gitkeep`
- Delete: `user-flows/flows/data-mart-build/.gitkeep`
- Delete: `user-flows/flows/domain-ci-cd/.gitkeep`
- Delete: `user-flows/flows/ingestion/.gitkeep`
- Delete: `user-flows/flows/installation/.gitkeep`
- Delete: `user-flows/flows/onboarding/.gitkeep`
- Delete: `user-flows/flows/skills-plugins/.gitkeep`
- Delete (if tracked): `user-flows/flows/.DS_Store`, `user-flows/flows/intent/.DS_Store`

**Do not** `rmdir user-flows/flows/` here — the two template files still live there. Final removal happens in Task C1.

- [ ] **Step 1: List every `.gitkeep` under `user-flows/flows/`**

```bash
find /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture/user-flows/flows -name ".gitkeep"
```

Expected: 7 files (one per empty category subfolder).

- [ ] **Step 2: git rm all `.gitkeep` files**

```bash
git -C /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture rm \
  user-flows/flows/app/.gitkeep \
  user-flows/flows/data-mart-build/.gitkeep \
  user-flows/flows/domain-ci-cd/.gitkeep \
  user-flows/flows/ingestion/.gitkeep \
  user-flows/flows/installation/.gitkeep \
  user-flows/flows/onboarding/.gitkeep \
  user-flows/flows/skills-plugins/.gitkeep
```

- [ ] **Step 3: git rm any tracked `.DS_Store` files**

```bash
git -C /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture ls-files \
  user-flows/flows/ | grep -F ".DS_Store"
```

If any lines returned, remove each with `git rm`. Otherwise skip.

- [ ] **Step 4: Remove now-empty category subdirectories**

```bash
rmdir /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture/user-flows/flows/app
rmdir /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture/user-flows/flows/data-mart-build
rmdir /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture/user-flows/flows/domain-ci-cd
rmdir /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture/user-flows/flows/ingestion
rmdir /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture/user-flows/flows/installation
rmdir /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture/user-flows/flows/onboarding
rmdir /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture/user-flows/flows/skills-plugins
rmdir /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture/user-flows/flows/context-management 2>/dev/null || true
rmdir /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture/user-flows/flows/operate 2>/dev/null || true
rmdir /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture/user-flows/flows/intent 2>/dev/null || true
```

(The `|| true` on the last three handles the case where those directories still contain files — it shouldn't, after Task A2's moves, but be defensive.)

- [ ] **Step 5: Verify the tree — only the two template files remain under `flows/`**

```bash
ls /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture/user-flows/flows
```

Expected exactly:

```text
_flow-spec-template-rationalization-2026-04-22.md
_flow-spec-template.md
```

- [ ] **Step 6: Commit C**

```bash
git -C /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture commit -m "$(cat <<'EOF'
docs(flows): remove empty category scaffolding from user-flows/flows/

Drops .gitkeep placeholders from the 7 empty category subfolders (app,
data-mart-build, domain-ci-cd, ingestion, installation, onboarding,
skills-plugins) and removes the now-empty directories. The two template
files remain in user-flows/flows/ and relocate to the engineering-skills
plugin in a subsequent commit.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase B — Build the skill in `ad-plugins/engineering-skills`

### Task B1: Verify engineering-skills branch state

**Files:** none — verification only.

- [ ] **Step 1: Confirm you are on the feature branch with the design spec already committed**

```bash
git -C /Users/shwetanksheel/scratch/ad-plugins/engineering-skills status
git -C /Users/shwetanksheel/scratch/ad-plugins/engineering-skills log --oneline -3
```

Expected: branch is `feature/authoring-flow-spec`; most recent commit is the spec-expansion commit.

- [ ] **Step 2: Pull the latest state (no-op if already up to date)**

```bash
git -C /Users/shwetanksheel/scratch/ad-plugins/engineering-skills fetch origin
```

---

### Task B2: Copy updated template from vd-specs-* to skill `references/`

**Files:**

- Create: `skills/authoring-flow-spec/references/flow-spec-template.md` (copied + renamed from `vd-specs-*/user-flows/flows/_flow-spec-template.md`)
- Create: `skills/authoring-flow-spec/references/flow-spec-template-rationalization.md` (copied + renamed from `vd-specs-*/user-flows/flows/_flow-spec-template-rationalization-2026-04-22.md`)

- [ ] **Step 1: Create the target references directory**

```bash
mkdir -p /Users/shwetanksheel/scratch/ad-plugins/engineering-skills/skills/authoring-flow-spec/references
```

- [ ] **Step 2: Copy the updated template (already updated in Task A3) into the skill**

```bash
cp /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture/user-flows/flows/_flow-spec-template.md \
   /Users/shwetanksheel/scratch/ad-plugins/engineering-skills/skills/authoring-flow-spec/references/flow-spec-template.md
```

- [ ] **Step 3: Copy the rationalization doc, dropping the date suffix from the filename**

```bash
cp /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture/user-flows/flows/_flow-spec-template-rationalization-2026-04-22.md \
   /Users/shwetanksheel/scratch/ad-plugins/engineering-skills/skills/authoring-flow-spec/references/flow-spec-template-rationalization.md
```

- [ ] **Step 4: Add a provenance note to the top of each copy**

Edit the first line of each new file to include:

```markdown
<!-- Moved from vd-specs-product-architecture/user-flows/flows/ on 2026-04-24. See the engineering-skills repo for ongoing history. -->
```

Place the comment immediately after any existing frontmatter/first-line headers but before the main content. Both files need this.

- [ ] **Step 5: Verify markdownlint is clean on both**

```bash
cd /Users/shwetanksheel/scratch/ad-plugins/engineering-skills
markdownlint \
  skills/authoring-flow-spec/references/flow-spec-template.md \
  skills/authoring-flow-spec/references/flow-spec-template-rationalization.md
```

Expected: no output. If errors, fix inline.

---

### Task B3: Create `references/sheet-interop.md`

**Files:**

- Create: `skills/authoring-flow-spec/references/sheet-interop.md`

- [ ] **Step 1: Write the file**

Write this content to `skills/authoring-flow-spec/references/sheet-interop.md`:

```markdown
# Sheet Interop — User-Flows-Details

The authoring-flow-spec skill reads the User-Flows-Details Google Sheet to
resolve a canonical ID's target repo, category, title, and persona. This file
documents the exact `gws` commands the skill uses.

## Sheet coordinates

- **Sheet ID:** `1nq0ab_E6sAjxR7WgihsF92CGfRzj7lCe3Z3GQSu25kA`
- **Primary tab:** `Flow Inventory`
- **Columns read by the skill:** B (Canonical ID), C (repo), D (Category),
  E (Flow Title), K (Persona)
- **Columns never written by the skill:** H (Status), F (User Flow Owner),
  G (Product owner), L (Filename HYPERLINK formula), M (Linear)

## Command patterns

### 1. Fetch a specific canonical ID's row

\`\`\`bash
gws sheets spreadsheets values get --params \\
  '{"spreadsheetId":"1nq0ab_E6sAjxR7WgihsF92CGfRzj7lCe3Z3GQSu25kA","range":"Flow Inventory!A2:M"}' \\
  --format csv | awk -F, -v id="<canonical-id>" '$2 == id'
\`\`\`

The skill filters client-side on column B (canonical ID). Sheet-level query
APIs are not used because `gws` does not expose them directly.

Expected output: one CSV row, 13 columns. If no row matches, treat as a
child-flow candidate and fall through to Phase 2a of the skill workflow
(longest-prefix parent match).

### 2. List all canonical IDs for the current target repo

Used when the user invokes the skill without a canonical ID and cannot name
one. Shows the IDs that belong to the repo you are currently inside.

\`\`\`bash
gws sheets spreadsheets values get --params \\
  '{"spreadsheetId":"1nq0ab_E6sAjxR7WgihsF92CGfRzj7lCe3Z3GQSu25kA","range":"Flow Inventory!B2:E"}' \\
  --format csv | awk -F, -v repo="<current-repo>" '$2 == repo { print $1, "-", $4 }'
\`\`\`

Output shape: one line per flow in that repo, `<canonical-id> - <title>`.
Present this list to the user as numbered choices.

### 3. Authentication check (used in Phase 0)

\`\`\`bash
gws auth status
\`\`\`

Exit code `0` means logged in. Non-zero exit or missing command means abort
the workflow with the re-auth instructions:

> Run `gws auth login` first, then retry.

## Never do this

- Never write to any Sheet cell from this skill. Writes are the exclusive
  responsibility of the `update-flow-status` command (for status) and the
  Sheet-sync rule's documented `gws ... batchUpdate` patterns (for schema).
- Never append a new row for a missing canonical ID. Abort and point the
  user at `.claude/rules/user-flows-sheet-sync.md` in
  `vd-specs-product-architecture`.
- Never assume the column layout. If `gws` returns fewer than 13 columns,
  the Sheet schema has drifted — abort and surface the drift to the user.
```

(The code blocks above use escaped backticks to survive being nested inside
this plan document. When you actually write the file, use plain triple
backticks.)

- [ ] **Step 2: Run markdownlint on the new file**

```bash
cd /Users/shwetanksheel/scratch/ad-plugins/engineering-skills
markdownlint skills/authoring-flow-spec/references/sheet-interop.md
```

Expected: no output.

---

### Task B4: Create `references/writing-the-draft.md`

**Files:**

- Create: `skills/authoring-flow-spec/references/writing-the-draft.md`

- [ ] **Step 1: Write the file**

Write this content to `skills/authoring-flow-spec/references/writing-the-draft.md`:

```markdown
# Writing the Draft — Altitude Discipline

The authoring-flow-spec skill enforces the template's altitude rules during
Phase 5 (scaffold) and Phase 7 (self-review). This file is the concise
reference the skill consults when writing or reviewing a section.

## The altitude test (applied to every paragraph)

Pause on any sentence and ask:

> *"Could a competent engineer using Claude Code build this differently from
> what I'm describing, and still be correct?"*

If **yes**, the altitude is correct — the spec describes behavior, not
implementation. If **no**, the sentence has slipped into design / functional
territory. Cut the prescriptive detail or move it to a downstream spec.

## What the spec MUST document

- The user's or system's goal.
- The trigger that starts the flow.
- Preconditions — things that must be true *before* the trigger fires.
- Inputs consumed and outputs produced (without source/destination attribution).
- The success outcome and every terminal outcome.
- Main flow (numbered steps) OR Phases with nested children (for parents).
- Alternate flows (A1, A2, …).
- Failure cases (F1, F2, …).
- State transitions (only for genuinely stateful flows).
- Business rules — behavioral parameters, thresholds, enumerations.
- Invariants — guarantees that must hold regardless of execution path.
- Events / observability at kind-level only.
- Cross-references to upstream / downstream sibling flows and existing
  production artifacts, by canonical ID or artifact name.

## What the spec MUST NOT document

- UI layout, visual design, styling, component structure.
- Copywriting, interaction microdetails.
- Specific event names, payload schemas, label strings, column names,
  signal identifiers — these are design concerns.
- Exact retry counts, iteration limits, timeout values.
- Internal state machines of implementation components — only user-visible
  or behaviorally-meaningful state belongs here.
- File paths, class names, API shapes, code snippets.

## Three legitimate-cite exception classes

Cite names by value only when they fall into one of these:

1. **Existing production artifacts** — data structures, protocol blocks,
   file conventions, or runtimes that already exist in code. Example:
   the `vd-meta` block, `intent.md`, `design.md`, the `vd-monitoring-agents`
   runtime.
2. **Canonical sibling flow IDs** — when describing what the flow excludes
   or what upstream / downstream flows are responsible for. Example:
   `alert-fire-route`, `operate-diagnosis-agent`,
   `intent-user-data-mart-build-intent-creation`.
3. **Already-cited artifacts in a prior version** — if a pre-existing spec
   cited an artifact by name and the artifact still maps to reality,
   preserve the reference.

Anything else that looks like a specific name (e.g. `triage-pending`,
`severity:p1`) is an *illustrative example*, not a prescription. State that
explicitly near the top of the Scope section.

## Business rules vs invariants — do not combine

- **Business rule** — a *behavioral parameter or constraint*. Editable when
  product changes the parameter. Example: *"Severity tiers: p1 / p2 / p3
  (no p0, no p4)."*
- **Invariant** — a *guarantee that must hold regardless of execution path*.
  If violated, the flow is broken even if every step succeeded. Example:
  *"Webhook handling is idempotent."*

These are separate template sections for a reason. Combining them hides
invariants among parameter bullets.

## Events / observability — kind-level only

Name the *classes* of events the flow must make observable. Do NOT specify
event names, payload fields, or catalog schemas.

Good: *"A completion telemetry event must be emittable with the run's
terminal outcome; each finding decision must be observable; authoring
failures must be distinguishable from upstream input errors."*

Not good: *"`issue_retro_completed` — duration_ms, findings_detected,
prs_opened, terminal_state."* That's functional-spec detail.

## Open Questions discipline

- List only questions that are genuinely unresolved.
- Tag each `[product]` or `[design]`.
- Design-tagged questions stay as Open Questions through spec finalization.
- Product-tagged questions should be resolved during Phase 6 brainstorming.
```

- [ ] **Step 2: Run markdownlint**

```bash
cd /Users/shwetanksheel/scratch/ad-plugins/engineering-skills
markdownlint skills/authoring-flow-spec/references/writing-the-draft.md
```

Expected: no output.

---

### Task B5: Write `SKILL.md`

**Files:**

- Create: `skills/authoring-flow-spec/SKILL.md`

- [ ] **Step 1: Write the file**

Write this content to `skills/authoring-flow-spec/SKILL.md`:

````markdown
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

# Authoring a Vibedata Flow Spec

## When to use this

Use this skill when authoring or updating a **top-level, behavior-focused
user-flow specification** for a Vibedata flow. The output is the source-of-truth
artifact. Downstream functional specs, design specs, and implementation plans
link back to this one — not the other way around.

This skill is **not** for:

- Design specs (mockups, component structure, copy, styling)
- Functional specs (explicit event names, payload schemas, retry policies)
- Implementation plans (file paths, class names, migration steps)
- PRDs (market positioning, business case)

If the user asks for any of the above, redirect: the flow spec is a prerequisite
for all of them. Produce the flow spec first; the downstream artifacts link to
it later.

## Prerequisites

Before invoking the skill, confirm:

- `gws` CLI is installed and logged in (`gws auth status` exits zero).
- Current working directory is inside a git checkout of one of the four
  target repos: `studio`, `skill-builder`, `domain-cicd`, `migration-utility`.
- The flow's canonical ID exists as a row in the User-Flows-Details Sheet
  (or the author has scheduled to add it per
  `vd-specs-product-architecture/.claude/rules/user-flows-sheet-sync.md`).

## Workflow

### Phase 0 — Precondition check

1. Verify `command -v gws` resolves.
2. Run `gws auth status`. If non-zero, abort with:

   > Run `gws auth login` first, then retry.

3. Verify `git rev-parse --is-inside-work-tree` exits zero.
4. Parse `git remote get-url origin` to extract the repo name (everything
   after the last `/`, stripping `.git`). Must match one of
   `{studio, skill-builder, domain-cicd, migration-utility}`. Otherwise abort
   with the four legitimate repo names listed.

### Phase 1 — Identify the canonical ID

- If the invocation passed an ID (e.g., `/author-flow-spec intent-user-data-mart-build`),
  use it.
- Otherwise ask: *"Which canonical ID are you authoring?"*
- If the author cannot name one, use the pattern from
  `references/sheet-interop.md` to list candidate IDs for the current repo,
  then let them pick.

### Phase 2 — Fetch Sheet row

Run the `values get` command from `references/sheet-interop.md` to fetch
the row matching the canonical ID. Extract columns:

- `B` = canonical ID
- `C` = `repo` (target repo name)
- `D` = `category`
- `E` = `title`
- `K` = `persona`

Do NOT read column H (`status`); the skill never writes back to the Sheet.

If no row matches, proceed to Phase 2a.

### Phase 2a — Child-flow inference

Attempt a longest-prefix match of the candidate ID against column B across all
rows. If a prefix match is found, the candidate is a child of that parent.
Parent prefix collisions are assumed impossible (design-time assumption from
the spec author).

If no parent prefix matches, abort with:

> No row found for `<id>` and no parent prefix match. Add a row to the Sheet
> first (see `.claude/rules/user-flows-sheet-sync.md`) or verify the ID
> spelling.

### Phase 3 — Verify repo alignment

Compare the current repo name from Phase 0 to the Sheet's column C (for a
parent/standalone) or the parent's column C (for a child). If they differ,
abort:

> You are in `<current-repo>` but flow `<id>` targets `<sheet-repo>`. Re-run
> this skill from the correct repo.

### Phase 4 — Check for existing spec

- **Parent/standalone target path:**
  `<repo-root>/docs/functional/<canonical-id>/README.md`
- **Child target path:**
  `<repo-root>/docs/functional/<parent-id>/NN-<child-slug>.md`, where `NN`
  is the child's 1-indexed position (zero-padded to two digits) in the
  parent's `sub-flows:` frontmatter list.

**Child-authoring precondition:** the parent's `README.md` **must** already
exist at `<repo-root>/docs/functional/<parent-id>/README.md`, AND the child's
composite ID must appear in that README's `sub-flows:` list. If either is
missing, abort:

> Author the parent flow `<parent-id>` first (and add `<child-id>` to its
> `sub-flows:` list).

If the target file already exists, read it and ask the author:

> Spec already exists. Update in place (preserve closed sections, re-run
> brainstorming on open ones), or abort?

Otherwise, proceed to draft.

### Phase 5 — Draft the scaffold

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
(e.g., `[describe the goal]`) that Phase 6 will close.

### Phase 6 — Hand off to `superpowers:brainstorming`

Invoke `Skill("superpowers:brainstorming")` with the following context:

> The draft flow spec lives at `<path>`. Pressure-test it section by section.
> The altitude rules and the authoring prompt are in
> `references/flow-spec-template.md`; honor them. Use the typical brainstorming
> arc: summarize the behavioral model in 4–6 bullets → enumerate Open
> Questions → ask one at a time, editing the draft inline after each answer.

Wait for brainstorming to return control before proceeding.

### Phase 7 — Self-review

Apply the altitude test per `references/writing-the-draft.md` to every
paragraph. Check for:

- Placeholders: `TBD`, `TODO`, `[describe…]`.
- Internal contradictions: do Main flow steps and Success outcome align?
  Do Business rules contradict Invariants?
- Altitude violations: design detail that slipped in.
- Illegitimate name citations: anything outside the three legitimate-cite
  classes.
- Unresolved behavioral Open Questions: these must be either resolved or
  have a specific resolution path. Design-tagged (`[design]`) Open Questions
  may remain.

Fix inline. Single pass; do not re-loop.

### Phase 8 — Write output and offer commit

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
- Running outside the four target repos.
- Writing to any Sheet cell.

## Cross-skill handoffs

| When | Invoke |
|---|---|
| Phase 6 (pressure-test the draft) | `superpowers:brainstorming` |
| Before claiming the spec is complete | `superpowers:verification-before-completion` |
| Author asks to open a Linear PR after the spec lands | `engineering-skills:raising-linear-pr` |
| Author asks for the design spec or implementation plan | Redirect — those link back to the flow spec; produce the flow spec first |

## References

- `references/flow-spec-template.md` — canonical template, folder-per-ID
  layout. Loaded in Phase 5 (scaffold) and Phase 7 (self-review).
- `references/flow-spec-template-rationalization.md` — rationale behind the
  template's structure. Human-oriented; maintainers only.
- `references/sheet-interop.md` — `gws` command patterns for Phase 1
  (candidate listing) and Phase 2 (row fetch).
- `references/writing-the-draft.md` — altitude test, legitimate-cite
  classes, business-rules-vs-invariants distinction, events/observability
  kind-level rule.

## Out of scope

- Status updates. Use `update-flow-status` instead.
- Creating or updating Sheet rows. Follow
  `vd-specs-product-architecture/.claude/rules/user-flows-sheet-sync.md`
  manually.
- `git push`. The author pushes when ready.
- Migrating pre-existing flow specs from the archive to the target repos.
  Each migration is a separate invocation of this skill.

````

- [ ] **Step 2: Run markdownlint**

```bash
cd /Users/shwetanksheel/scratch/ad-plugins/engineering-skills
markdownlint skills/authoring-flow-spec/SKILL.md
```

Expected: no output. If errors, fix inline before continuing.

---

### Task B6: Create the command wrapper

**Files:**

- Create: `commands/author-flow-spec.md`

- [ ] **Step 1: Create the `commands/` directory (first one in this repo)**

```bash
mkdir -p /Users/shwetanksheel/scratch/ad-plugins/engineering-skills/commands
```

- [ ] **Step 2: Write the command file**

Write this content to `commands/author-flow-spec.md`:

```markdown
---
description: Author a behavior-focused user-flow spec from a canonical ID. Thin wrapper around the authoring-flow-spec skill.
---

# /author-flow-spec

Invoke the `authoring-flow-spec` skill to author (or update) a user-flow
specification.

## Usage

- `/author-flow-spec <canonical-id>` — author the flow with the given canonical
  ID (e.g., `/author-flow-spec intent-user-data-mart-build`).
- `/author-flow-spec` — invoke the skill with no ID; the skill will ask.

## What this does

Delegates to `Skill("authoring-flow-spec")`. The skill:

1. Confirms `gws` is logged in and you are inside one of the four target repos
   (`studio`, `skill-builder`, `domain-cicd`, `migration-utility`).
2. Looks up the canonical ID in the User-Flows-Details Sheet to resolve
   target `repo`, `category`, `title`, `persona`.
3. Verifies the repo you are in matches the Sheet's `repo` column.
4. Drafts the spec against the bundled flow-spec template.
5. Hands off to `superpowers:brainstorming` to pressure-test the draft.
6. Writes the result to `<repo>/docs/functional/<canonical-id>/README.md`
   (or `NN-<child-slug>.md` if the ID is a child composite).
7. Offers to commit — you decide when.

For the full behavior contract, see
[`skills/authoring-flow-spec/SKILL.md`](../skills/authoring-flow-spec/SKILL.md).
```

- [ ] **Step 3: Run markdownlint**

```bash
cd /Users/shwetanksheel/scratch/ad-plugins/engineering-skills
markdownlint commands/author-flow-spec.md
```

Expected: no output.

---

### Task B7: Register skill in `AGENTS.md`

**Files:**

- Modify: `AGENTS.md` — add entry to "Skills" section.

- [ ] **Step 1: Locate the Skills section**

```bash
grep -n "^## Skills$" /Users/shwetanksheel/scratch/ad-plugins/engineering-skills/AGENTS.md
```

- [ ] **Step 2: Add the new skill entry**

Add this line to the end of the bullet list under "## Skills" (alphabetical
by skill name — inserted at the top since `authoring-flow-spec` comes first):

```markdown
- `skills/authoring-flow-spec/SKILL.md` - author a Vibedata user-flow specification from a canonical ID in the User-Flows-Details Sheet
```

- [ ] **Step 3: Run markdownlint**

```bash
cd /Users/shwetanksheel/scratch/ad-plugins/engineering-skills
markdownlint AGENTS.md
```

Expected: no output.

---

### Task B8: Register skill in `README.md`

**Files:**

- Modify: `README.md` — add row to the "Current Skills" table and a directory to the layout tree.

- [ ] **Step 1: Add the directory to the layout tree**

Locate the existing tree around `skills/adversarial-review/` (near line 18–29)
and insert `authoring-flow-spec/` above `closing-linear-issue/` in the list so
the alphabetical order is preserved.

- [ ] **Step 2: Add the row to the Current Skills table**

Locate the table at the bottom of `README.md`. Insert this row immediately
after the existing `adversarial-review` row (alphabetical):

```markdown
| [`authoring-flow-spec`](./skills/authoring-flow-spec) | Author a behavior-focused Vibedata user-flow spec from a canonical ID in the User-Flows-Details Sheet; writes to the target repo's `docs/functional/<id>/README.md`. |
```

- [ ] **Step 3: Run markdownlint**

```bash
cd /Users/shwetanksheel/scratch/ad-plugins/engineering-skills
markdownlint README.md
```

Expected: no output.

---

### Task B9: Update `repo-map.json`

**Files:**

- Modify: `repo-map.json` — update `modules.skills.description` to reflect the new skill count and add the new skill to `notes_for_agents` if relevant.

- [ ] **Step 1: Read the current file**

```bash
cat /Users/shwetanksheel/scratch/ad-plugins/engineering-skills/repo-map.json | head -50
```

- [ ] **Step 2: Update the `modules.skills.description` field**

Change:

```json
"description": "Canonical skill directories (12 skills). Each skill owns its SKILL.md and any supporting references, assets, scripts, or agents."
```

To:

```json
"description": "Canonical skill directories (13 skills). Each skill owns its SKILL.md and any supporting references, assets, scripts, or agents."
```

- [ ] **Step 3: Add a top-level `commands` entry**

After the `"scripts": { ... }` block inside `modules`, add:

```json
"commands": {
  "path": "commands/",
  "description": "Top-level slash-command wrappers. Thin delegators to the skills under skills/. First entry: /author-flow-spec → authoring-flow-spec skill."
},
```

(Watch the trailing comma: make sure `scripts` still has a comma after its
closing brace if `commands` now follows it.)

- [ ] **Step 4: Add `commands/` to `key_directories`**

Inside `key_directories`, add:

```json
"commands/": "Top-level slash-command wrappers that delegate to skills",
```

- [ ] **Step 5: Bump `generated_at` to today**

Change:

```json
"generated_at": "2026-04-20T00:00:00Z"
```

To:

```json
"generated_at": "2026-04-24T00:00:00Z"
```

- [ ] **Step 6: Validate JSON**

```bash
jq . /Users/shwetanksheel/scratch/ad-plugins/engineering-skills/repo-map.json > /dev/null
```

Expected: no output, exit code zero. If JSON is malformed, `jq` will print the
parse error — fix it.

---

### Task B10: Plugin version bump check

**Files:**

- `.claude-plugin/plugin.json` — currently has no top-level `version` field; confirm nothing needs bumping.
- `.codex-plugin/plugin.json` — currently has no top-level `version` field; confirm the same.

The plan's spec mentions `1.0.6 → 1.1.0`, but inspection showed no `version`
field in either manifest. The marketplace may track version elsewhere. This
task verifies no changes are needed in-repo.

- [ ] **Step 1: Search both manifests for a version field**

```bash
grep -l '"version"' \
  /Users/shwetanksheel/scratch/ad-plugins/engineering-skills/.claude-plugin/plugin.json \
  /Users/shwetanksheel/scratch/ad-plugins/engineering-skills/.codex-plugin/plugin.json
```

Expected: no output (no file contains a version field). Proceed to Step 2.

If any file DOES contain a version field, update it from the current value
to the next minor version (e.g., `1.0.6` → `1.1.0`).

- [ ] **Step 2: Confirm the `version-bump-check.yml` workflow tolerates this**

```bash
cat /Users/shwetanksheel/scratch/ad-plugins/engineering-skills/.github/workflows/version-bump-check.yml
```

Read the workflow. If it requires a version field that does not exist, raise
this with the user before proceeding — it may need a separate fix.

- [ ] **Step 3: No commit needed unless a version field was found and changed**

---

### Task B11: Commit Phase B

**Files:** all Phase B files.

- [ ] **Step 1: Review the diff**

```bash
git -C /Users/shwetanksheel/scratch/ad-plugins/engineering-skills status
git -C /Users/shwetanksheel/scratch/ad-plugins/engineering-skills diff --stat
```

Expected: 6 new files under `skills/authoring-flow-spec/`, 1 new file under
`commands/`, modifications to `AGENTS.md`, `README.md`, `repo-map.json`.

- [ ] **Step 2: Run the full markdownlint sweep one more time**

```bash
cd /Users/shwetanksheel/scratch/ad-plugins/engineering-skills
markdownlint \
  skills/authoring-flow-spec/SKILL.md \
  skills/authoring-flow-spec/references/flow-spec-template.md \
  skills/authoring-flow-spec/references/flow-spec-template-rationalization.md \
  skills/authoring-flow-spec/references/sheet-interop.md \
  skills/authoring-flow-spec/references/writing-the-draft.md \
  commands/author-flow-spec.md \
  AGENTS.md \
  README.md
```

Expected: no output. Fix any errors inline.

- [ ] **Step 3: Run the required eval gates** (per `AGENTS.md`)

```bash
cd /Users/shwetanksheel/scratch/ad-plugins/engineering-skills/tests/evals
npm run eval:coverage
npm run eval:codex-compatibility
```

Expected: both commands exit zero. If coverage complains about a new
uncovered skill (`authoring-flow-spec`), add it to the baseline exemption list
at `tests/evals/skill-eval-coverage-baseline.json` — eval coverage for this
skill is deferred per the design spec's non-goals.

- [ ] **Step 4: Stage everything and commit**

```bash
git -C /Users/shwetanksheel/scratch/ad-plugins/engineering-skills add \
  skills/authoring-flow-spec \
  commands/author-flow-spec.md \
  AGENTS.md \
  README.md \
  repo-map.json \
  tests/evals/skill-eval-coverage-baseline.json  # only if modified in Step 3

git -C /Users/shwetanksheel/scratch/ad-plugins/engineering-skills commit -m "$(cat <<'EOF'
feat(skills): add authoring-flow-spec skill and /author-flow-spec command

New skill owns end-to-end authoring for Vibedata user-flow specs. Looks up
a canonical ID in the User-Flows-Details Sheet, verifies the current repo
matches the Sheet's repo column, drafts against the bundled template,
hands off to superpowers:brainstorming to pressure-test, and writes to
<repo>/docs/functional/<canonical-id>/README.md (or NN-<child-slug>.md
for children of a parent flow).

Template moved from vd-specs-product-architecture/user-flows/flows/ into
the skill's references/ directory — the template is now self-contained
within this plugin. See docs/superpowers/specs/2026-04-24-authoring-flow-
spec-design.md for the full design.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: Push the branch**

```bash
git -C /Users/shwetanksheel/scratch/ad-plugins/engineering-skills push -u origin feature/authoring-flow-spec
```

---

### Task B12: Open a PR against `main` in engineering-skills

**Files:** none — PR metadata only.

- [ ] **Step 1: Create the PR**

```bash
cd /Users/shwetanksheel/scratch/ad-plugins/engineering-skills
gh pr create --base main --head feature/authoring-flow-spec --title "Add authoring-flow-spec skill and /author-flow-spec command" --body "$(cat <<'EOF'
## Summary

- Introduces the `authoring-flow-spec` skill for Vibedata user-flow spec authoring
- Adds the `/author-flow-spec` command as a thin wrapper
- Relocates the flow-spec template and rationalization doc from `vd-specs-product-architecture` into this plugin's `references/`

## Design

Full design spec at [`docs/superpowers/specs/2026-04-24-authoring-flow-spec-design.md`](docs/superpowers/specs/2026-04-24-authoring-flow-spec-design.md).

## Test plan

- [x] `markdownlint` clean on all new `.md` files
- [x] `npm run eval:coverage` passes
- [x] `npm run eval:codex-compatibility` passes
- [ ] Reviewer: spot-check `SKILL.md` Phase 0–8 workflow against the design spec
- [ ] Reviewer: verify the command delegates correctly and contains no scope beyond delegation
- [ ] Post-merge: integration test from inside `studio` or `skill-builder`

## Related

- Follow-on: `feature/relocate-flow-specs` in `vd-specs-product-architecture` removes the original template and updates dependent rules. That branch must not merge until this PR is merged and the plugin release propagates.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 2: Note the PR URL** — you will reference it in Phase C's Commit E update to `user-flows/CLAUDE.md` if the marketplace update needs a version tag.

---

## Phase C — Finish vd-specs-* cleanup (run AFTER engineering-skills PR is merged)

**IMPORTANT: Do not start Phase C until the engineering-skills PR from Task B12 is merged and the plugin marketplace has updated.** Merging Phase C first would leave the template existing nowhere on any main branch.

### Task C1: Commit D — remove templates from vd-specs-* and rmdir `user-flows/flows/`

**Files:**

- Delete: `user-flows/flows/_flow-spec-template.md`
- Delete: `user-flows/flows/_flow-spec-template-rationalization-2026-04-22.md`

- [ ] **Step 1: Verify the engineering-skills skill is live**

```bash
ls ~/.claude/skills/authoring-flow-spec/references/flow-spec-template.md 2>/dev/null \
  || ls /Users/shwetanksheel/scratch/ad-plugins/engineering-skills/skills/authoring-flow-spec/references/flow-spec-template.md
```

Expected: file exists. If not, STOP — do not proceed until the skill is live.

- [ ] **Step 2: git rm both templates in vd-specs-***

```bash
git -C /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture rm \
  user-flows/flows/_flow-spec-template.md \
  user-flows/flows/_flow-spec-template-rationalization-2026-04-22.md
```

- [ ] **Step 3: rmdir the now-empty `user-flows/flows/`**

```bash
rmdir /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture/user-flows/flows
```

Expected: success. If it fails with `Directory not empty`, run `ls user-flows/flows` to see what's left — probably stray `.DS_Store` — delete it manually and retry.

- [ ] **Step 4: Commit D**

```bash
git -C /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture commit -m "$(cat <<'EOF'
docs(flows): remove relocated templates and drop user-flows/flows/

The flow-spec template and its rationalization doc now live in the
authoring-flow-spec skill in ad-plugins/engineering-skills. See that
skill's references/ for the canonical source. This commit removes the
originals and the now-empty user-flows/flows/ directory.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task C2: Commit E (part 1) — update `.claude/rules/user-flows-sheet-sync.md`

**Files:**

- Modify: `.claude/rules/user-flows-sheet-sync.md`

- [ ] **Step 1: Read the current file to identify sections that need rewriting**

```bash
grep -n "user-flows/flows\|_flow-spec-template\|category_slug_map\|HYPERLINK\|Flow-spec file layout" \
  /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture/.claude/rules/user-flows-sheet-sync.md
```

Note line numbers for each hit.

- [ ] **Step 2: Replace the "Flow-spec file layout" section**

Replace the existing section (header `## Flow-spec file layout`) with:

```markdown
## Flow-spec file layout

Flow specs live in each flow's target GitHub repo (`repo` column C) under
`docs/functional/<Canonical ID>/`. Every canonical ID gets its own folder:

- **Standalone / Parent:** `<repo>/docs/functional/<canonical-id>/README.md`
- **Child:** `<repo>/docs/functional/<parent-id>/NN-<child-slug>.md`
  (sibling of the parent's README, with a zero-padded order prefix)

The template and authoring workflow live in the `authoring-flow-spec` skill
in the [engineering-skills plugin](https://github.com/accelerate-data/engineering-skills).
See that skill's `SKILL.md` for the authoring procedure.
```

- [ ] **Step 3: Replace the column L HYPERLINK formula**

Find the existing `## Filename HYPERLINK formula` section. Replace the
formula code block with:

```text
=IF(OR(ISBLANK(C{row}), C{row}="#N/A"),
    "pending repo assignment",
    HYPERLINK(
      "https://github.com/accelerate-data/" & C{row} & "/blob/main/docs/functional/" & B{row} & "/README.md",
      "docs/functional/" & B{row} & "/README.md"
    ))
```

Update the surrounding prose to say "column C (repo)" and "column B (canonical ID)"
in place of the previous `category_slug_map` references.

- [ ] **Step 4: Delete the `category_slug_map` documentation**

Find and remove the paragraph that documents the hidden helper columns Z:AA
(`category_slug_map`). Category is no longer part of the filename path.

- [ ] **Step 5: Run markdownlint**

```bash
markdownlint /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture/.claude/rules/user-flows-sheet-sync.md
```

Expected: no output.

---

### Task C3: Commit E (part 2) — update `user-flows/CLAUDE.md`

**Files:**

- Modify: `user-flows/CLAUDE.md`

- [ ] **Step 1: Read the current file**

```bash
cat /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture/user-flows/CLAUDE.md
```

- [ ] **Step 2: Replace the moai-workflow-spec reference**

Find the line referencing `moai-workflow-spec` (currently reads:
*"Use the `moai-workflow-spec` skill: `Skill(\"moai-workflow-spec\")` …"*)
and replace the whole "User Flow & SPEC Creation" section with:

```markdown
## User Flow & SPEC Creation

When creating user flows, journey maps, feature specs, or requirement
documents, use the `authoring-flow-spec` skill in the
[engineering-skills plugin](https://github.com/accelerate-data/engineering-skills).
The skill owns the end-to-end authoring path — Sheet lookup, repo verification,
template-compliant drafting, pressure-test handoff to superpowers:brainstorming,
and file write.

Quick invocation: `/author-flow-spec <canonical-id>` (positional argument),
or any natural-language phrasing such as *"draft a flow spec for <id>"*.

Flow specs no longer live in this repository. They live in each target repo
at `docs/functional/<Canonical ID>/`. This directory (`user-flows/`) now holds
only:

- `_archive/flows/` — historical flow specs, frozen in place for reference.
- `status/` — per-owner status tracking. See `status/README.md`.
- `_changelog.md` — structural changes to the user-flows workspace.
- Rules under `.claude/rules/` that govern the User-Flows-Details Sheet.
```

- [ ] **Step 3: Run markdownlint**

```bash
markdownlint /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture/user-flows/CLAUDE.md
```

Expected: no output.

---

### Task C4: Commit E (part 3) — insert "Authoring a Flow Spec" section into `user-flows/status/README.md`

**Files:**

- Modify: `user-flows/status/README.md`

- [ ] **Step 1: Locate the insertion point**

Open the file. Find the `---` horizontal rule that follows the *"Linear Tagging"*
section (current line 39) and precedes the *"Ownership"* header (current line 42).
The new section goes between the trailing `---` of Linear Tagging and the
`## Ownership` header.

- [ ] **Step 2: Insert the new section**

Insert this block after the `---` that follows Linear Tagging and before
`## Ownership`:

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

1. Confirms `gws` is logged in and you are inside one of the four target
   repos (`studio`, `skill-builder`, `domain-cicd`, `migration-utility`).
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

---
```

(Note the trailing `---` that separates this section from the existing
*"Ownership"* heading.)

- [ ] **Step 3: Run markdownlint**

```bash
markdownlint /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture/user-flows/status/README.md
```

Expected: no output.

- [ ] **Step 4: Commit all of Commit E's three-part changes**

```bash
git -C /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture add \
  .claude/rules/user-flows-sheet-sync.md \
  user-flows/CLAUDE.md \
  user-flows/status/README.md

git -C /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture commit -m "$(cat <<'EOF'
docs(flows): point dependent rules and READMEs at authoring-flow-spec skill

Updates three files that referenced the old user-flows/flows/ layout or the
prior authoring path:

- .claude/rules/user-flows-sheet-sync.md: rewrites "Flow-spec file layout" for
  the new docs/functional/<canonical-id>/ convention, replaces the col L
  HYPERLINK formula to use col C (repo) with an #N/A guard, drops the
  category_slug_map hidden-helper documentation.
- user-flows/CLAUDE.md: replaces the moai-workflow-spec reference with a
  pointer to the new authoring-flow-spec skill.
- user-flows/status/README.md: inserts an "Authoring a Flow Spec" section
  between Linear Tagging and Ownership.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task C5: Commit F — append changelog entry

**Files:**

- Modify: `user-flows/_changelog.md`

- [ ] **Step 1: Read the current top of the file**

```bash
head -20 /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture/user-flows/_changelog.md
```

- [ ] **Step 2: Add a new row at the top of the table (newest first)**

Based on the existing changelog format, add a row dated `2026-04-24`:

```markdown
| 2026-04-24 | Structural | Archived all 22 flow files to `_archive/flows/`; removed `user-flows/flows/` directory; relocated `_flow-spec-template.md` and its rationalization doc into the `authoring-flow-spec` skill in the `engineering-skills` plugin. Updated `.claude/rules/user-flows-sheet-sync.md`, `user-flows/CLAUDE.md`, and `user-flows/status/README.md` to point at the new skill. Updated Sheet column L HYPERLINK formula to use column C (`repo`) with an `#N/A` guard. |
```

Adapt the exact column layout to match the existing table schema — the
placeholder above shows three columns; the actual file may use different
columns or a different format. Match the existing entries' structure.

- [ ] **Step 3: Run markdownlint**

```bash
markdownlint /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture/user-flows/_changelog.md
```

Expected: no output.

- [ ] **Step 4: Commit F**

```bash
git -C /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture add user-flows/_changelog.md

git -C /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture commit -m "$(cat <<'EOF'
docs(flows): log 2026-04-24 structural migration in user-flows/_changelog.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: Push and open PR**

```bash
git -C /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture push -u origin feature/relocate-flow-specs

cd /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture
gh pr create --base main --head feature/relocate-flow-specs --title "Relocate flow specs: archive existing, move template to engineering-skills plugin" --body "$(cat <<'EOF'
## Summary

- Archives all 22 existing flow files to `user-flows/_archive/flows/`
- Updates `_flow-spec-template.md` to the folder-per-canonical-ID + README.md convention
- Relocates template + rationalization to the `authoring-flow-spec` skill in ad-plugins/engineering-skills (paired PR: <engineering-skills PR URL>)
- Rewrites Sheet column L HYPERLINK formula to use column C (`repo`) with an `#N/A` guard; drops `category_slug_map` helper
- Updates `.claude/rules/user-flows-sheet-sync.md`, `user-flows/CLAUDE.md`, and `user-flows/status/README.md` to point at the new skill
- Removes `user-flows/flows/` directory

**Do not merge until the engineering-skills PR is merged and the plugin release is live.**

## Test plan

- [x] `markdownlint` clean on all modified `.md` files
- [x] `user-flows/flows/` directory does not exist after the branch is applied
- [x] `grep -r "_flow-spec-template\|moai-workflow-spec"` returns zero hits
- [ ] Reviewer: pull the Sheet col L formula into a test row with `studio` in col C and verify the rendered hyperlink resolves
- [ ] Reviewer: spot-check that an archived flow file (e.g., `ctx-issue-retro-agent.md`) still carries its git history via `git log --follow`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Phase D — Sheet schema change

### Task D1: Update column L HYPERLINK formula on the live Sheet

**Files:** none in git — `gws` batchUpdate against the live Sheet.

This task modifies live production data on the User-Flows-Details Sheet. Run
only after both PRs (engineering-skills + vd-specs-*) are merged.

- [ ] **Step 1: Determine the last populated row**

```bash
gws sheets spreadsheets values get --params '{"spreadsheetId":"1nq0ab_E6sAjxR7WgihsF92CGfRzj7lCe3Z3GQSu25kA","range":"Flow Inventory!A:A"}' --format csv | grep -c -v "^$"
```

Note the count — that is `<lastrow>`.

- [ ] **Step 2: Apply the new formula across all data rows**

Write a batch-update JSON payload to update range `Flow Inventory!L2:L<lastrow>`.
The formula to set in every cell (relative refs `B{row}` and `C{row}` resolve
per-row automatically in Google Sheets):

```text
=IF(OR(ISBLANK(C2), C2="#N/A"), "pending repo assignment", HYPERLINK("https://github.com/accelerate-data/" & C2 & "/blob/main/docs/functional/" & B2 & "/README.md", "docs/functional/" & B2 & "/README.md"))
```

Run:

```bash
gws sheets spreadsheets batchUpdate --params '{"spreadsheetId":"1nq0ab_E6sAjxR7WgihsF92CGfRzj7lCe3Z3GQSu25kA"}' --json '{"requests":[{"repeatCell":{"range":{"sheetId":<sheet_gid>,"startRowIndex":1,"endRowIndex":<lastrow>,"startColumnIndex":11,"endColumnIndex":12},"cell":{"userEnteredValue":{"formulaValue":"=IF(OR(ISBLANK(C2), C2=\"#N/A\"), \"pending repo assignment\", HYPERLINK(\"https://github.com/accelerate-data/\" & C2 & \"/blob/main/docs/functional/\" & B2 & \"/README.md\", \"docs/functional/\" & B2 & \"/README.md\"))"}},"fields":"userEnteredValue"}}]}'
```

Replace `<sheet_gid>` with the numeric `sheetId` of the `Flow Inventory`
tab (get it from `gws sheets spreadsheets get --params '{"spreadsheetId":"..."}' --fields sheets.properties`)
and `<lastrow>` with the value from Step 1.

Note: `startColumnIndex` is zero-indexed, so column L = 11.

- [ ] **Step 3: Drop hidden helper columns Z:AA (`category_slug_map`)**

Clear the helper-column values so the Sheet no longer shows the retired
lookup range.

```bash
gws sheets spreadsheets values clear --params '{"spreadsheetId":"1nq0ab_E6sAjxR7WgihsF92CGfRzj7lCe3Z3GQSu25kA","range":"Flow Inventory!Z1:AA100"}'
```

---

### Task D2: Spot-check the new formula

**Files:** none — manual verification.

- [ ] **Step 1: Check a known-valid row (has a real repo in column C)**

```bash
gws sheets spreadsheets values get --params '{"spreadsheetId":"1nq0ab_E6sAjxR7WgihsF92CGfRzj7lCe3Z3GQSu25kA","range":"Flow Inventory!B2:L2"}' --format csv
```

Expected in column L: a URL of the form
`https://github.com/accelerate-data/<repo>/blob/main/docs/functional/<canonical-id>/README.md`.

- [ ] **Step 2: Check a row with `#N/A` in column C**

Filter to find such a row and verify column L renders `pending repo assignment`.

```bash
gws sheets spreadsheets values get --params '{"spreadsheetId":"1nq0ab_E6sAjxR7WgihsF92CGfRzj7lCe3Z3GQSu25kA","range":"Flow Inventory!A2:L"}' --format csv | awk -F, '$3 == "#N/A"' | head -2
```

Expected in column L: `pending repo assignment` (literal text, not a URL).

---

## Phase E — Integration smoke test

### Task E1: End-to-end invocation against a known flow

**Files:** (test output only — no commits in this task)

- [ ] **Step 1: Pick a canonical ID whose `repo` in Sheet column C is `studio`**

From the Sheet, pick any row where column C = `studio`. Note its canonical ID.

- [ ] **Step 2: `cd` into the studio repo checkout**

```bash
cd <path-to-studio-clone>
```

(You may need to clone it first: `gh repo clone accelerate-data/studio` into
your working area.)

- [ ] **Step 3: Invoke the command**

```text
/author-flow-spec <canonical-id>
```

- [ ] **Step 4: Verify Phase 0–4 run cleanly**

Expected:

- Phase 0 confirms `gws` login and `studio` repo.
- Phase 2 pulls the row and surfaces `repo=studio`, `category=<…>`, `title=<…>`,
  `persona=<…>`.
- Phase 3 confirms the repo match.
- Phase 4 confirms no existing file at `docs/functional/<canonical-id>/README.md`.

- [ ] **Step 5: Verify Phase 5 draft includes all required template sections**

Check the draft file contains frontmatter with `id`, `title`, `persona`,
`last-reviewed`, plus sections: Goal, Scope, Preconditions, Trigger, Primary
actor, Inputs, Outputs, Success outcome, Terminal outcomes, Main flow.

- [ ] **Step 6: Step through brainstorming (Phase 6)**

Answer 2–3 questions to verify the hand-off to `superpowers:brainstorming`
works.

- [ ] **Step 7: Let the skill write the file and verify path**

After Phase 8 writes, confirm:

```bash
ls <studio-root>/docs/functional/<canonical-id>/README.md
```

Expected: file exists.

- [ ] **Step 8: Answer `n` to the commit prompt** — we are testing, not shipping.

- [ ] **Step 9: Clean up — discard the test file**

```bash
rm -rf <studio-root>/docs/functional/<canonical-id>/
```

---

### Task E2: Integration smoke test — child-flow path

**Files:** (test output only)

- [ ] **Step 1: Pick a canonical ID that corresponds to a child of an existing parent**

This requires a parent flow's `README.md` to already exist in the target repo
with a `sub-flows:` frontmatter list that includes the child's ID. If no such
parent exists yet (expected — this is the first run), skip to E3.

- [ ] **Step 2: Invoke `/author-flow-spec <parent-id>-<child-slug>`**

- [ ] **Step 3: Verify the skill correctly identifies this as a child**

Expected: Phase 2 returns no Sheet row; Phase 2a identifies the parent via
longest-prefix match; Phase 4 confirms the parent's README exists and the
composite ID appears in the parent's `sub-flows:` list.

- [ ] **Step 4: Verify the write path is `NN-<child-slug>.md`**

```bash
ls <target-repo>/docs/functional/<parent-id>/NN-<child-slug>.md
```

Expected: file exists with the correct zero-padded NN prefix.

- [ ] **Step 5: Clean up — discard the test file**

---

### Task E3: Integration smoke test — error paths

**Files:** (test output only)

Verify the skill aborts cleanly in each of the following situations. After each,
the workspace should be unchanged.

- [ ] **Step 1: Invoke from outside any of the four target repos**

`cd` into some other git repo and run `/author-flow-spec intent-user-data-mart-build`.
Expected: Phase 0 aborts with the four-repo list.

- [ ] **Step 2: Invoke with a canonical ID that has no Sheet row and no parent prefix match**

`/author-flow-spec nonexistent-flow-foo`. Expected: Phase 2a aborts with
instructions to add a Sheet row first.

- [ ] **Step 3: Invoke in the wrong repo (mismatch with Sheet column C)**

From inside `studio`, invoke with a canonical ID whose Sheet column C says
`skill-builder`. Expected: Phase 3 aborts with the repo-mismatch message.

- [ ] **Step 4: Invoke for a child whose parent README does not exist**

Expected: Phase 4 aborts with *"Author the parent flow `<parent-id>` first …"*.

---

## Phase F — Follow-ups and deferred items

These are not implemented in this plan but are tracked here so they do not
fall off the radar.

### Task F1: Log eval coverage as deferred

**Files:**

- Modify: `tests/evals/skill-eval-coverage-baseline.json`

- [ ] **Step 1: If Task B11 Step 3 did not already add `authoring-flow-spec` to the baseline, add it now**

```bash
cat /Users/shwetanksheel/scratch/ad-plugins/engineering-skills/tests/evals/skill-eval-coverage-baseline.json
```

If `authoring-flow-spec` is not listed, add it with a comment/note that eval
coverage is explicitly deferred per the design spec's non-goals.

- [ ] **Step 2: Commit if changed**

---

### Task F2: Open a follow-up issue for the eval suite

**Files:** none — Linear-side work.

- [ ] **Step 1: Create a Linear issue**

Use the `engineering-skills:create-feature-request` skill to open an
Internal-IT-scoped issue titled:

> Add promptfoo eval suite for authoring-flow-spec skill

Description should note that three minimum scenarios are needed (standalone,
parent, child) per the design spec's Open Items section.

---

## Self-Review Checklist

After implementing this plan, verify:

- [ ] The `user-flows/flows/` directory does not exist in `vd-specs-product-architecture`.
- [ ] `grep -r "_flow-spec-template" /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture` returns zero hits.
- [ ] `grep -r "moai-workflow-spec" /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture` returns zero hits.
- [ ] `find /Users/shwetanksheel/scratch/99_working/vd-specs-product-architecture/user-flows/_archive/flows -name "*.md" | wc -l` returns `22`.
- [ ] `ls /Users/shwetanksheel/scratch/ad-plugins/engineering-skills/skills/authoring-flow-spec/references/` lists four `.md` files.
- [ ] `ls /Users/shwetanksheel/scratch/ad-plugins/engineering-skills/commands/` includes `author-flow-spec.md`.
- [ ] Sheet column L on row 2 renders a working GitHub URL (spot check).
- [ ] Sheet column L on a row with `#N/A` in column C renders the literal text `pending repo assignment`.
- [ ] Running `/author-flow-spec <known-id>` inside a target repo reaches Phase 6 (brainstorming) successfully.
- [ ] Both PRs merged in the correct order: engineering-skills first, vd-specs-* second.

---

## Notes for the implementer

- **Use worktrees.** Both repos support sibling worktrees. For engineering-skills,
  use `./scripts/worktree.sh feature/authoring-flow-spec`. For vd-specs-*, create
  a sibling worktree manually if preferred. Working from worktrees keeps your
  main checkout clean.
- **Do not skip commits.** The plan's commit boundaries (A, B, C, D, E, F)
  exist so that rollback is cheap if any step fails.
- **Sheet changes are live production data.** Run Task D1 only after both PRs
  are merged. If you are unsure about `sheet_gid`, fetch it with
  `gws sheets spreadsheets get --params '{"spreadsheetId":"..."}' --fields sheets.properties`
  before running `batchUpdate`.
- **Cross-repo merge ordering is critical.** Merging Phase C (vd-specs-* cleanup)
  before Phase B (engineering-skills skill) leaves the template orphaned.
- **Markdownlint runs at every step.** The pre-commit hook in engineering-skills
  will block commits that fail lint. Always run it before staging.
