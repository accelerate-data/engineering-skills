# Writing the Draft — Altitude Discipline

The authoring-flow-spec skill enforces the template's altitude rules during
Phase 6 (scaffold) and Phase 8 (self-review). This file is the concise
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
- Product-tagged questions should be resolved during Phase 7 brainstorming.
