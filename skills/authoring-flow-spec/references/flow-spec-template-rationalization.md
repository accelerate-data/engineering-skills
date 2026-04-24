# Flow Spec Template Rationalization — 2026-04-22

<!-- Moved from vd-specs-product-architecture/user-flows/flows/ on 2026-04-24. See the engineering-skills repo for ongoing history. -->

This document captures the decisions behind the current [`flow-spec-template.md`](flow-spec-template.md). It exists so co-owners (Jason, HB, UK, Shwetank) can see the reasoning, not just the outcome, and redirect future changes with context.

## Context

Prior to 2026-04-22 there were two competing template shapes in circulation for user-flow specifications.

### Pre-rationalization `_flow-spec-template.md` (in this repo)

A behavior-focused, monolithic atomic-flow spec. Sections: `Goal`, `Scope`, `Preconditions`, `Trigger`, `Primary actor`, `Success outcome`, `Terminal outcomes`, `Main flow`, `Alternate flows` (A1/A2), `Failure cases` (F1/F2), `State transitions`, `Business rules and invariants` (combined), `Events / logging / observability`, `Open questions`. One altitude for all flows. State machines and event catalogs were explicit and detailed — in practice the template read as a functional spec.

Two exemplars written under this shape:

- `_archive/flows/context-management/ctx-issue-retro-agent.md` (archived — will be refactored to `<skill-builder-or-studio>/docs/functional/ctx-issue-retro-agent/README.md`)
- `_archive/flows/operate/pipeline-operate-triage-agent.md` (archived — will be refactored to `<target-repo>/docs/functional/pipeline-operate-triage-agent/README.md`)

### UK's Workflow Specification variant

Developed independently by Umesh Kakkad in `vd-studio` on branch `task/detail-workflows-examples-uk`, under `docs/functional/workflows/`. Layered structure:

- Top-of-doc header: `Purpose`, `Trigger`, `Personas`, `Durable outputs`, `User gates`, `Invariants`.
- Body grouped by `Phases` (5 in the `data-mart-build` instance).
- Each phase contains multiple `Stages` with their own mini-spec: `Purpose`, `Trigger`, `Inputs`, `Expected behavior`, `Outputs`, `Stage acceptance`, `Notable failure modes`.
- Explicit Altitude Test: *"could a competent engineer build this differently and still be correct?"*

Audience: engineers using agentic coders. The shape was deliberately lighter than a functional spec, with design / functional detail pushed downstream.

### Why rationalize

Both shapes describe behavior at the user-flow layer, but diverged on:

- **Altitude** — pre-rationalization read as a functional spec (state machines, explicit event catalogs, exhaustive business rules). UK's was deliberately lighter, with prescriptive detail pushed downstream.
- **Granularity** — pre-rationalization treated "one atomic agent behavior" as the unit. UK treated a multi-stage user journey as the unit.
- **Structure** — pre-rationalization was uniform (all sections present for every flow). UK's mixed full-template stages and paragraph stages.
- **Failure naming** — pre-rationalization used numbered `A1`/`F1` (greppable). UK used inline prose.

The rationalized template (`_flow-spec-template.md`) chooses one coherent shape, borrowing what works from both and aligning the file-layout model with the updated Google Sheet (`User-Flows-updates-20260419`).

## Principles applied

- The flow spec is the **top-level user-flow document**. Downstream functional and design specs link back to it; not vice versa.
- The **Altitude Test** governs every paragraph: *"could a competent engineer build this differently and still be correct?"* If no, the paragraph has slipped into design / functional territory and must be cut or relocated downstream.
- Specific label strings, event names, payload schemas, retry counts, and schema keys are **design concerns**. They belong downstream.
- The behavioral spine of a flow must remain stable across UI redesigns and implementation shifts.
- Numbered naming (`A1`, `F1`, `F2`) is a **grep interface** for downstream specs to reference unambiguously — not formatting.
- The User-Flows-Details Sheet is canonical for `owner`, `wave`, `status`, `category`. The file is canonical for behavior.

## Cross-referencing discipline

When a flow spec names another flow (upstream, downstream, or excluded) or an existing production artifact, cite it by canonical ID or artifact name. The Altitude Test targets *design-phase names* — event strings, label values, new component names an implementer would choose — not *stable identifiers*.

Stable identifiers include:

- Sheet canonical IDs for sibling flows (`alert-fire-route`, `operate-diagnosis-agent`, `intent-user-data-mart-build-intent-creation`).
- Production artifacts already in code (`vd-meta`, `intent.md`, `design.md`, `agent-spec.md`, `claude.md`, `data-engineer.md`).
- Runtime / infrastructure names already in code (`vd-monitoring-agents`).

The template's "Labels, tags, and signal names" section enumerates these three classes as explicit exceptions to the illustrative-only rule. Added 2026-04-22 after a refactor pass on `pipeline-operate-triage-agent` over-applied the Altitude Test and stripped legitimate sibling-flow cross-references from Scope / Excluded. Stable identifiers are how Scope / Excluded stays useful, and how handoffs are traceable.

## Key decisions

| # | Decision | Value | Rationale |
| --- | --- | --- | --- |
| Q1 | Grain | Atomic flow file is the unit; parent flow indexes its children when they exist. | Mirrors the updated Sheet's row-per-flow model. Each flow file can be referenced independently; parents aggregate when a flow genuinely decomposes into named sub-stages. |
| Q2A | Parent content shape | **Thick** — narrative `Purpose` + `Personas` + `Durable outputs` + `User gates` + `Invariants` + phase narrative + child index. | A child flow in isolation lacks context (what journey does it belong to? what gates bracket it? what durable artifacts does this journey produce?). The thick parent carries that once for the whole journey. |
| Q2B | File layout | Every canonical ID gets a folder at `docs/functional/<canonical-id>/` inside its target repo. Standalones have a single `README.md`. Parents have `README.md` plus sibling `NN-<child>.md` child files. Category (Sheet col D) is no longer in the path; target repo is Sheet col C. (Original convention — parent at `flows/<category>/<slug>.md`, children in sibling folder — was retired 2026-04-24 when the template moved to the `authoring-flow-spec` skill.) | The parent `.md` and child subfolder share the same base name, so pairing is self-documenting without a `kind:` field. Numeric prefix on children encodes sequence / phase order in the filesystem. |
| Q3 | Atomic flow altitude | **Option B — medium lean-down** from pre-rationalization. | The pre-rationalization template was doing too much work — reading like a functional spec. Option B strips implementation-adjacent details (specific event names, state machines for linear flows, retry counts) while preserving the behavioral spine (numbered paths, named failures, business rules, invariants). |
| Q3.1 | `State transitions` | *Optional* — include only for genuinely stateful flows. | Forcing a state machine onto a linear flow adds noise. Optional keeps the value for flows that need it (e.g., `operate-triage-agent`'s webhook lifecycle) without forcing it everywhere. |
| Q3.2 | `Events / observability` | *Optional*, **kind-level only**. | Specific event names and payload schemas are design choices owned by the functional / design spec. Behavior at this layer is *"completion telemetry must be emittable"* — not `event_name` strings with payload fields. Same discipline as the existing labels/tags caveat, extended to events. |
| Q3.3 | `Business rules` vs `Invariants` | **Separated into two sections**, each optional. | Different failure modes. A business rule (tier / threshold / enumeration) changes when the product parameter changes. An invariant (a guarantee) being violated means the flow is broken regardless of per-step success. Combining them hides invariants among parameter bullets. |
| Q3.4 | Alternate flows | Numbered `A1, A2, …`, each with a descriptive name. | Preserves greppable references from downstream specs / incident reports (`<flow-id>#A2`). |
| Q3.5 | Failure cases | Numbered `F1, F2, …` with `Trigger` / `Response` / `Final state`. | Tighter than the pre-rationalization shape but preserves the numbered grep interface. |
| Q3.6 | `Inputs` / `Outputs` sections | Added (borrowed from UK's variant). | The pre-rationalization template inferred these from `Scope` and `Success outcome`, which proved ambiguous. Explicit `Inputs` / `Outputs` sections clarify what a flow consumes and produces. |
| Q4.1 | `kind:` frontmatter field | **Dropped.** | Subfolder + filename convention disambiguates parent / child / standalone unambiguously. A `kind:` field would be redundant and prone to drift. |
| Q4.2 | Child canonical ID | **Composite**: `<parent-slug>-<child-slug>`. | Globally unique, matches the filesystem path's semantic, stable across renames of unrelated flows. The ~20-character extra length is worth the clarity. |
| Q4.3 | Parent's child listing | **Mutually exclusive** — `Phases` or `Child flows`. | Redundancy between a narrative phase table and a flat index creates drift. Pick one. |
| Q5A | Number of templates | **One unified template** with a single conditional (`Main flow` vs `Phases`). | An earlier proposal had two distinct templates (parent-doc vs atomic-flow). That duplicated the journey-context sections. A single template with one conditional section handles all three shapes (standalone, parent, child) cleanly. |
| Q5B | Phase structure for parents | **Always use `Phases`** (not flat `Child flows`). | Every parent-with-children gets the same shape, so readers and downstream tools rely on finding phase structure. Trivial cases use a single phase ("Phase 1 — Main flow") containing all children. |
| — | Existing samples | **Refactor**, do not grandfather. | Grandfathered samples stop being exemplars — they become "the old way" that new authors copy. Refactoring keeps `ctx-issue-retro-agent` and `operate-triage-agent` usable as reference examples once updated. |

## Template shape summary

Sections of `_flow-spec-template.md`, in order. **Bold** = always; *italic* = optional; ⧉ = conditional on children.

| # | Section | Status |
| --- | --- | --- |
| 1 | `# Flow: <Title> (<id>)` | **Always** |
| 2 | `## Goal` | **Always** |
| 3 | `## Scope` (with label-names caveat) | **Always** |
| 4 | `## Preconditions` | *Optional* |
| 5 | `## Trigger` | **Always** |
| 6 | `## Primary actor` | **Always** |
| 7 | `## Inputs` | **Always** (new, from UK) |
| 8 | `## Outputs` | **Always** (new, from UK) |
| 9 | `## Success outcome` | **Always** |
| 10 | `## Terminal outcomes` | **Always** |
| 11a | `## Main flow` | ⧉ No children — numbered steps |
| 11b | `## Phases` | ⧉ Has children — narrative intros + nested child links |
| 12 | `## Alternate flows` | *Optional* — `A1`, `A2`, … |
| 13 | `## Failure cases` | *Optional* — `F1`, `F2`, … with Trigger / Response / Final state |
| 14 | `## State transitions` | *Optional* — genuinely stateful flows only |
| 15 | `## Business rules` | *Optional* — parameters / thresholds / enumerations |
| 16 | `## Invariants` | *Optional* — guarantees across all paths |
| 17 | `## Events / observability` | *Optional* — **kind-level only** |
| 18 | `## Open questions` | *Optional* — tagged `[product]` or `[design]` |

## File layout + frontmatter conventions

- **Standalone / Parent**: `<target-repo>/docs/functional/<canonical-id>/README.md`. Frontmatter has `id`, `title`, `persona`, `last-reviewed` (plus `sub-flows:` for parents).
- **Child**: `<target-repo>/docs/functional/<parent-id>/NN-<child-slug>.md` — sibling of the parent's `README.md`. Frontmatter adds `parent: <parent-slug>`. Canonical ID is composite: `<parent-slug>-<child-slug>`.
- The `<target-repo>` is one of `studio`, `skill-builder`, `domain-cicd`, `migration-utility` (Sheet column C). Category (Sheet column D) is no longer part of the file path.

## What the template explicitly is NOT

- **Not a design spec.** No mockups, copy, component structure, interaction microdetails.
- **Not a functional spec.** No explicit event names, no payload schemas, no retry policies, no explicit state machines of implementation components.
- **Not a PRD.** No market positioning, business case, or adoption plan.
- **Not an implementation plan.** No file paths, class names, API shapes.

Downstream specs (functional, design, implementation plan) link *to* the flow spec. The flow spec is the stable anchor.

## Migration plan

### Existing samples to refactor

Both pre-rationalization samples require refactoring to match the rationalized template. They were explicit exemplars of the old shape and will read as "the old way" if grandfathered.

- **`_archive/flows/context-management/ctx-issue-retro-agent.md`** — standalone flow, rich state machine and event catalog.
  - `State transitions` section: keep (genuinely stateful).
  - `Events / logging / observability`: down-rank to kind-level only. The explicit event catalog moves to a downstream functional spec (path TBD).
  - `Business rules and invariants`: split into two sections per the new convention. Most of the detailed bullets are business rules; surface the genuine invariants (e.g., *"Idempotent proposals — re-running retro on the same input window must not produce duplicate PRs"*) into their own section.
  - `Inputs` / `Outputs` sections: add.
- **`_archive/flows/operate/pipeline-operate-triage-agent.md`** — standalone flow, heavy state machine, long event catalog.
  - Rename to `pipeline-operate-triage-agent` per the Updated Flow List Sheet row (update `id`, add `renamed-from: operate-triage-agent`, update the `# Flow:` header).
  - `State transitions` section: keep (webhook lifecycle + reconciliation state).
  - `Events / logging / observability`: down-rank to kind-level only. The `alertEvents.triageStatus` fields and structured log names move to a downstream functional spec.
  - `Business rules and invariants`: split into two sections.
  - `Inputs` / `Outputs` sections: add.

**Sequence:** refactor these two only after the rationalized template is confirmed in use. Treat each refactor as its own session — run the spec through the `superpowers:brainstorming` skill, update the `last-reviewed` date, and update the Sheet.

### Sheet-sync rule updates

[`.claude/rules/user-flows-sheet-sync.md`](/.claude/rules/user-flows-sheet-sync.md) — updated 2026-04-24 to reflect the folder-per-ID layout (`docs/functional/<canonical-id>/`). The `Filename` column L HYPERLINK formula now points to the target repo's `docs/functional/` path. Category is no longer encoded in the file path; target repo is Sheet column C.

### Changelog

This rationalization is a structural change to the template and file-layout model. It warrants an entry in [`_changelog.md`](../_changelog.md). Call this out on the next changelog pass; not done in this session.

## Deferred / open

- **Per-parent Sheet tabs.** The updated Sheet (`User-Flows-updates-20260419`) has per-parent tabs — `Data Mart Build` (18 chat-stage rows), `Ingestion Build` (16 rows) — separate from the main `Updated Flow List` tab. Whether child flow specs get rows in these per-parent tabs — and whether the sheet-sync rule needs extending to cover them — is deferred. The current sync rule only covers the flat inventory.
- **Sub-flow semantics in non-Intent categories.** The `Updated Flow List`'s `Data Mart Build` category contains `data-mart-deploy`, `data-mart-pr-creation`, `data-mart-pr-review-approval`, `data-mart-rollback`, each labeled "Sub-flow" in Notes. These are **not** children of `intent-user-data-mart-build` — they are standalone parents in their own category, and "Sub-flow" describes their sequencing role in the broader user journey, not a file-layout parent-child relationship. Worth documenting more explicitly once the first of these flows is authored.
- **"Data Mart Build" as a cross-category user journey.** The overall data-mart experience spans Intent (`intent-user-data-mart-build`, `intent-issue-data-mart-build`) → Data Mart Build (deploy, PR creation, PR review, rollback). There is currently no single file that tells that end-to-end narrative. Whether such a file is needed (e.g., as a product architecture doc, separate from the individual flow specs) is a product-architecture question, not a user-flow template one.
- **Single-phase parents.** The template allows a single-phase parent ("Phase 1 — Main flow") for trivial multi-child cases. No open flow yet tests this; when one does, confirm the shape still reads well or adjust.
