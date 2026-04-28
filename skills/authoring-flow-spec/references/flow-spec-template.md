# Flow Spec Template & Authoring Prompt

<!-- Moved from vd-specs-product-architecture/user-flows/flows/ on 2026-04-24. See the engineering-skills repo for ongoing history. -->

This file is both:

1. **A prompt** that another agent can follow verbatim to author a new behavior-focused flow specification in this directory.
2. **A template** showing the exact frontmatter and section structure to use.

Do not treat this file as a flow itself — the underscore prefix (`_flow-spec-template.md`) marks it as reference material. Rationale behind the current structure lives in [`_flow-spec-template-rationalization-2026-04-22.md`](_flow-spec-template-rationalization-2026-04-22.md).

---

## When to use this

Use this prompt when creating or restructuring a user-flow specification. A flow spec lives in its target GitHub repo (per the `repo` value in column C of the User-Flows-Details Sheet) at `docs/functional/<canonical-id>/`. A flow spec is the **top-level, behavior-focused source-of-truth artifact** for a user flow. Downstream functional specifications and detailed design documents link to this spec, not the other way around.

Flow specs are **not**:

- Design specs (mockups, component structure, copy, styling).
- Functional specs (explicit event names, payload schemas, retry policies, detailed state machines for implementation components).
- Implementation plans (file paths, class names, migration steps).
- PRDs (market positioning, business case).

---

## Three flow shapes

Every flow is one file. Its frontmatter and filesystem position tell you whether it has a parent, or children, or neither. All three shapes use the **same template**; one section flexes based on shape.

| Shape | Frontmatter marker | File path inside target repo | Behavior section |
| --- | --- | --- | --- |
| **Standalone** | neither `parent:` nor `sub-flows:` | `docs/functional/<canonical-id>/README.md` | `## Main flow` (numbered steps) |
| **Parent (has children)** | `sub-flows:` list | `docs/functional/<canonical-id>/README.md` | `## Phases` (narrative + nested child links) |
| **Child (of a parent)** | `parent: <parent-slug>` | `docs/functional/<parent-id>/NN-<child-slug>.md` (sibling of parent's README) | `## Main flow` (numbered steps) |

Every canonical ID gets its own folder under `docs/functional/`. Standalones have a single `README.md`. Parents have `README.md` plus sibling `NN-<child-slug>.md` child files. Children do not get their own folders — they live as siblings beside the parent's `README.md`. A child's canonical ID is the composite `<parent-slug>-<child-slug>`.

**Children are expected primarily in the `Intent` category** (e.g., chat-journey flows like `intent-user-data-mart-build` with many internal stages). Most flows in other categories are standalone.

### File layout

```text
<target-repo>/docs/functional/
├─ <standalone-canonical-id>/
│  └─ README.md
│
└─ <parent-canonical-id>/
   ├─ README.md                          ← parent flow spec
   ├─ 01-<first-child-slug>.md           ← child flow specs
   ├─ 02-<second-child-slug>.md
   └─ …
```

Child filenames begin with a zero-padded sequence prefix (`01-`, `02-`, …). The prefix encodes reading / phase order; it is **not** part of the canonical ID. The child's canonical ID is still the composite `<parent-slug>-<child-slug>`.

---

## The authoring prompt

Use the following prompt as-is (or adapt it lightly) when tasking an agent to author a new flow spec:

> You are authoring a **top-level, behavior-focused flow specification**. This is the source-of-truth user-flow document. Downstream functional and design specs link back to this one.
>
> ### The output must document
>
> - the user's / system's goal
> - the trigger
> - preconditions (things that must be true **before** the trigger fires)
> - inputs consumed and outputs produced
> - the success outcome and all terminal outcomes
> - the main flow (numbered steps) **or** the phases with nested children (when the flow is a parent)
> - alternate flows (A1, A2, …)
> - failure cases (F1, F2, …)
> - state transitions (only when the flow is genuinely stateful)
> - business rules (behavioral parameters, thresholds, enumerations)
> - invariants (guarantees that hold regardless of execution path)
> - events / observability at **kind-level only** (classes of events that must be emittable; no specific event names or payload schemas)
> - cross-references to upstream / downstream sibling flows and existing production artifacts — by canonical ID or artifact name (see the three exception classes under "Labels, tags, and signal names")
>
> ### The output must NOT document
>
> - UI layout, visual design, styling, component structure
> - copywriting, interaction microdetails
> - specific event names, payload schemas, label strings, column names, signal identifiers — these are design concerns
> - exact retry counts, iteration limits, timeout values
> - internal state machines of implementation components (only user-visible / behaviorally-meaningful state belongs here)
> - file paths, class names, API shapes, code snippets
>
> ### The Altitude Test
>
> Pause on any sentence and ask:
>
> > *"Could a competent engineer using Claude Code build this differently from what I'm describing, and still be correct?"*
>
> If **yes**, you're at the right altitude.
> If **no** — every implementation choice is forced by your wording — you've slipped into design / functional territory. Cut the prescriptive detail or move it to a downstream spec.
>
> ### Principles
>
> - Focus on outcomes, state transitions, and observable system behavior.
> - Treat the flow spec as the top-level source of truth. Downstream specs link to it; not vice versa.
> - Separate facts from assumptions. Mark assumptions explicitly.
> - Call out open questions rather than guessing; tag each `[product]` or `[design]`.
> - Prefer precise, behavior-relevant language over UX language.
> - Organize around what changes in the system, not around screens or pages.
> - Keep the flow stable across UI redesigns and implementation shifts.
>
> ### Labels, tags, and signal names
>
> Where the spec must name a signal (e.g. `triage-pending`, `severity:p1`, `dbt-failure`), treat those names as **illustrative examples** of the behavior, not prescriptions. The actual string values are a design decision. Add a one-line note near the top of the Scope section clarifying this convention when the spec cites any such names.
>
> Three classes of names are legitimate to cite by value, *even though* they look like the illustrative strings you're told to cut:
>
> 1. **Existing production artifacts** — data structures, protocol blocks, file conventions, or runtimes that already exist in code (e.g., the `vd-meta` block, `intent.md`, `design.md`, the `vd-monitoring-agents` runtime). Citing by name is legitimate because the behavior is defined in terms of the artifact.
> 2. **Canonical sibling flow IDs** — when describing what this flow *excludes* or what *upstream / downstream* flows are responsible for, cite the sibling flow's canonical ID (e.g., `alert-fire-route`, `operate-diagnosis-agent`, `intent-user-data-mart-build-intent-creation`). The Sheet's canonical ID is a **stable name**, not a design-phase choice. Scope / Excluded lists and handoff references without these IDs lose traceability.
> 3. **Already-cited artifacts in a prior version** — if a pre-existing spec cited an artifact by name and the artifact still maps to reality, preserve the reference. Do not strip it in the name of altitude — the author had a reason.
>
> Rule of thumb: if the name appears in the User-Flows-Details Sheet (canonical ID column) or in production code (durable artifact, file, or runtime), citing it is fine. If it's a hypothetical future label or an event name someone picked while authoring, it's a design choice and belongs downstream.
>
> ### Business rules vs invariants — two different sections
>
> - **Business rules** are *behavioral parameters and constraints* — tiers, thresholds, enumerations, windows. Example: *"Severity tiers: p1 / p2 / p3 (no p0, no p4)."* If product changes the parameter, the rule gets edited. Business rules describe *how* the system behaves under given inputs.
> - **Invariants** are *guarantees that must hold regardless of execution path*. Example: *"Webhook handling is idempotent"* or *"Approval is recorded against the current version of `design.md`, so a later change forces re-approval."* If an invariant is violated, the flow is broken even if every individual step succeeded. Invariants describe *what must remain true* across all paths.
>
> These are separate sections in the template. Do not combine them. Combining hides invariants among parameter bullets.
>
> ### Events / observability — kind-level only
>
> Name the *classes* of events the flow must make observable for it to be trustworthy. Do **not** specify event names, payload fields, or catalog schemas — those live in the downstream functional or design spec.
>
> Good: *"A completion telemetry event must be emittable with the run's terminal outcome; each finding decision must be observable; authoring failures must be distinguishable from upstream input errors."*
>
> Not good: *"`issue_retro_completed` — duration_ms, findings_detected, prs_opened, terminal_state."* That's functional-spec detail.
>
> ### Open Questions discipline
>
> - List only questions that are genuinely unresolved. Do not invent gaps.
> - Tag each question `[product]` or `[design]` so the reader knows who resolves it.
> - If a question is a design concern (label names, schema keys, retry mechanics, notification channels), say so explicitly and keep it out of the behavioral body.
> - Resolve behavioral questions during brainstorming rather than leaving them in the spec.
>
> ### Finalization — use the superpowers brainstorming skill
>
> **After the initial draft, invoke the `brainstorming` skill from the `superpowers` plugin** to pressure-test and finalize the spec. Do this one flow at a time. Ask one question at a time; edit the draft to reflect each answer before asking the next.
>
> Typical brainstorming arc for a flow spec:
>
> 1. Summarize the draft's behavioral model in 4–6 bullets so the owner can correct the framing quickly.
> 2. Enumerate the Open Questions in priority order (structural / behavioral first, design details last).
> 3. Ask the top question as a multiple-choice. Accept the answer, **edit the draft to reflect it before asking the next question** — this keeps the draft and the conversation in sync and surfaces knock-on effects early.
> 4. Continue until all behavioral Open Questions are resolved. Design-phase Open Questions stay as Open Questions.
> 5. Run the self-review (see Process guidance below), then hand the spec back to the owner for approval.
>
> Do not skip this step, even for "simple" flows.
>
> ### Formatting
>
> - Numbered steps for `Main flow` and the internal steps inside each `Alternate flow`.
> - `### Phase N — <name>` headers with 2–3 sentence intros for `Phases`, and nested links to children underneath.
> - Bullet points for `Business rules`, `Invariants`, `Events`, `Terminal outcomes`.
> - Concise and structured. Enough detail for engineering and QA; no more.
> - Where applicable, identify what must be **persisted, validated, emitted, or blocked**.
> - Normalize vague input into clear system states and terminal outcomes.
>
> ### File location
>
> Write the spec to the target GitHub repo named in the User-Flows-Details Sheet's `repo` column:
>
> - Standalone or parent: `<repo>/docs/functional/<canonical-id>/README.md`
> - Child: `<repo>/docs/functional/<parent-id>/NN-<child-slug>.md`
>
> The canonical ID matches Sheet column B. The target repo is whatever value appears in Sheet column C for that row — there is no hardcoded list. Category (Sheet column D) is no longer encoded in the file path — it lives only in the Sheet.

---

## Frontmatter

### Standalone flow

```yaml
---
id: <canonical-slug>                   # matches Sheet canonical ID
title: <human-readable title>
persona: <DRE | FSA | AE | DE | MST>
last-reviewed: <YYYY-MM-DD>
# Optional — include only when applicable:
# renamed-from: <previous-slug>
# absorbs:
#   - <prior-slug-1>
#   - <prior-slug-2>
---
```

### Parent flow (has children)

```yaml
---
id: <canonical-slug>
title: <human-readable title>
persona: <DRE | FSA | AE | DE | MST>
last-reviewed: <YYYY-MM-DD>
sub-flows:                             # ordered — matches phase / reading order
  - <first-child-slug>
  - <second-child-slug>
  - …
# Optional:
# renamed-from: <previous-slug>
# absorbs: [<prior-slug-1>, …]
---
```

### Child flow (of a parent)

```yaml
---
id: <parent-slug>-<child-slug>         # composite canonical ID
title: <human-readable child title>
parent: <parent-slug>                  # pointer to parent
persona: <DRE | FSA | AE | DE | MST>
last-reviewed: <YYYY-MM-DD>
# Optional:
# renamed-from: <previous-slug>
# absorbs: [<prior-slug-1>, …]
---
```

**Not included** (deliberately — these live in the Sheet or are encoded in the path):

- `owner` — Sheet column F
- `wave` — Sheet column G
- `status` — Sheet column E
- `category` — folder path already encodes it
- `kind` — filename / subfolder convention already encodes parent vs child vs standalone

The Sheet is canonical for the first four. Duplicating them in frontmatter guarantees drift.

---

## Section structure

Sections below use these status markers:

- **bold** — required for every flow
- *italic* — optional; include only when the flow genuinely has content for it
- ⧉ — conditional on whether the flow has children (see Behavior section)

### Shared sections (apply to all three shapes)

```markdown
# Flow: <Title> (`<canonical-slug>`)

## Goal

One or two sentences. What user / system outcome does this flow achieve?

## Scope

**Included**

- …

**Excluded**

- …

> **A note on labels, tags, and signal names** throughout this spec: where the document names a specific signal, the **behavior** is what the spec prescribes; any cited label strings are illustrative examples. Equivalent names chosen during design are acceptable so long as the behavior is preserved.

## Preconditions  *(optional)*

Things that must be true **before** the trigger fires. Not interchangeable with trigger conditions.

- …

## Trigger

- …

## Primary actor

- …

## Inputs

What this flow consumes. No source attribution (do not say "from <Component>" — name the thing itself).

- …

## Outputs

What this flow produces. No destination attribution.

- …

## Success outcome

What must be true on the happy path.

- …

## Terminal outcomes

Every end state the flow can reach.

- **Success — <variant>** — …
- **User-abandoned** — …
- **System-blocked** — …
- (add more variants as needed; each is a distinct end-state)
```

### Behavior — use ONE of the following two sections ⧉

Which section applies depends on whether the flow has children (listed in `sub-flows:` frontmatter).

**Standalone flows and child flows (no children) use `Main flow`:**

```markdown
## Main flow

1. System / User …
2. System …
3. …
```

**Parent flows (have children) use `Phases` instead:**

```markdown
## Phases

### Phase 1 — <Phase Name>

Two to three sentences framing what this phase accomplishes and when it ends.

- [`01-<first-child-slug>`](<parent-slug>/01-<first-child-slug>.md) — one-line description.
- [`02-<second-child-slug>`](<parent-slug>/02-<second-child-slug>.md) — one-line description.

### Phase 2 — <Phase Name>

…
```

For a parent with few children that don't cluster into multiple phases, use a single phase ("Phase 1 — Main flow") with all children listed under it. The structure is always present; its depth scales with content.

### Remaining sections (apply to all shapes)

```markdown
## Alternate flows  *(optional)*

### A1. <name>

1. …
2. …

### A2. <name>

1. …
2. …

## Failure cases  *(optional)*

### F1. <name>

- Trigger: …
- Response: …
- Final state: …

### F2. <name>

- Trigger: …
- Response: …
- Final state: …

## State transitions  *(optional — include only for genuinely stateful flows)*

- <state A> → <state B> on <event>
- …

## Business rules  *(optional)*

Behavioral parameters, constraints, thresholds, enumerations.

- **<Rule name>** — …
- …

## Invariants  *(optional)*

Guarantees that must hold regardless of execution path.

- **<Invariant name>** — …
- …

## Events / observability  *(optional — kind-level only)*

Classes of events that must be emittable for the flow to be trustworthy. No specific event names or payload schemas.

- **<Event class>** — what it proves / why it must exist.
- …

## Open questions  *(optional)*

1. `[product]` **<Question>** — why it's still open, what would resolve it.
2. `[design]` **<Question>** — why it's still open, what would resolve it.
```

---

## Process guidance

1. **Identify the source material.** Gather: the canonical Sheet row (id, title, category, persona, absorbs / renamed-from); any prior flow specs; any existing design or implementation code if the flow is backed by code. Cite code only to ground behavioral claims — remove implementation-level citations before finalization.
2. **Decide the shape.** Standalone, parent, or child? If the flow in the Sheet corresponds to a chat journey with many internal stages (primarily in the Intent category), it is a parent — write `sub-flows:` frontmatter and plan the children as separate files in the sibling subfolder. Otherwise it is standalone or a child of some other parent.
3. **Draft with open questions.** First pass: capture behavior; mark ambiguities as explicit Open Questions tagged `[product]` or `[design]`.
4. **Brainstorm to close — use the `superpowers:brainstorming` skill.** One flow at a time. Ask one question at a time. Edit the draft inline after each answer.
5. **Self-review.** Scan for placeholders (`TBD`, `TODO`), internal contradictions, prescriptive design details that crept in, and Open Questions that are actually resolved. Apply the Altitude Test to every paragraph. Fix inline.
6. **Sync the Sheet.** Per `.claude/rules/user-flows-sheet-sync.md`, update the User-Flows-Details Google Sheet when a new flow is added, renamed, or materially changed. Child flow specs nested under a parent currently live outside the Sheet's main inventory tab — see [`_flow-spec-template-rationalization-2026-04-22.md`](_flow-spec-template-rationalization-2026-04-22.md) for deferred questions on per-parent tab conventions.

---

## Reference examples

Archived under `vd-specs-product-architecture/user-flows/_archive/flows/` for historical reference — these files were authored under the pre-rationalization template and have not been refactored to the folder-per-ID layout:

- `_archive/flows/context-management/ctx-issue-retro-agent.md` — standalone flow built from consolidation of three source flows.
- `_archive/flows/operate/pipeline-operate-triage-agent.md` — standalone flow backed by existing production code.

Until those samples are refactored into their target repo's `docs/functional/<canonical-id>/`, read this template's structure as the canonical source.
