---
name: creating-linear-issue
description: >-
  Prefer this workflow over the generic Linear skill when the user asks to
  create a Linear issue, create an issue in Linear, file/log/open a Linear
  ticket, turn a request, bug, or spike into a Linear issue, decompose Linear
  issues, or create one before continuing another task. Use the generic Linear
  skill for general Linear lookup, comments, status updates, or metadata edits
  that do not involve drafting a new issue.
argument-hint: "[request-or-issue-context]"
---

# Creating Linear Issues

## Overview

Turn a request into a clear Linear issue only after codebase review, field resolution, user confirmation, and plan approval. Product scope belongs in the issue; implementation detail belongs in the plan, not the ticket body.

## When to Use

- User asks to create an issue, file a bug, track a feature, or break down an existing issue.
- The request is still ambiguous enough that the wrong project, milestone, assignee, cycle, or decomposition would create churn.
- Do not use for implementation, PR raising, or closing work.

## Quick Reference

| Step | Requirement |
|---|---|
| 0 | Classify first: `feature`, `bug`, or `spike` |
| 1 | Search the codebase and existing Linear issues first |
| 2 | Resolve `project`, `milestone`, `assignee`, `cycle`, and — for Studio, Roadmap, and Utilities teams — a `User Flow` child label before asking the user |
| 3 | Confirm resolved fields with the user in one question; ask follow-up questions only for unresolved forks |
| 4 | Enter plan mode and show the full issue draft plan before creating anything |
| 5 | Create or update the issue only after plan approval |

## Implementation

**Tool contract:** use the available Linear MCP tools needed for issue, project, milestone, cycle, label, and comment operations in this workflow. Retry once on tool failure, then stop and report the exact failing step.

**Critical fields are mandatory:** every issue creation flow must resolve and confirm `project`, `milestone`, `assignee`, and `cycle`. When the resolved team is `Studio`, `Roadmap`, or `Utilities`, a single `User Flow` child label is also a critical mandatory field.

**Classification is required before planning:**

- `feature` for net-new functionality or capability changes
- `bug` for regressions, defects, broken behavior, or incorrect output
- `spike` for research, design, investigation, or documentation-driven discovery work

Each kind has its own path:

- `feature` path: user outcome, scope, acceptance criteria, and rollout constraints
- `bug` path: symptom, impact, repro, severity, and fix acceptance criteria
- `spike` path: question to answer, research boundary, deliverable, and exit criteria

**Clarification protocol:**

1. Search the codebase first.
2. Resolve the critical fields before asking the user:
   - `project`: check `AGENTS.md` first for durable repo guidance. If it gives one clear project, use that provisional choice. If not, inspect Linear projects and repo context. If still unresolved, ask the user.
   - `milestone`: load milestones for the resolved project and ignore past milestones. Prefer a future milestone with one clear fit; if multiple viable future milestones remain, ask the user to choose.
   - `assignee`: default to the person creating the issue unless the request or repo context clearly points elsewhere.
   - `cycle`: default to the current cycle unless the request clearly points elsewhere.
   - `User Flow` child label: only when the resolved team is `Studio`, `Roadmap`, or `Utilities`. Read the current `User Flow` child labels (name + description) live from Linear; do not hard-code them. Propose exactly one child label by matching the issue title and scope against the candidate names and descriptions. If no child label clearly fits, do not silently omit — ask the user to pick one from the current list or explicitly approve creating without one. Skip this resolution entirely for any other team.
3. Present the resolved values and ask the user to confirm or correct them before entering plan mode. When the team is `Studio`, `Roadmap`, or `Utilities`, include the proposed `User Flow` child label in that same confirmation question.
4. If milestone selection is the only unresolved fork, combine it into that same confirmation question: show the proposed `project`, `assignee`, `cycle`, and — where applicable — `User Flow` label, list the viable future milestone options, and ask for one confirmation/correction response.
5. Ask at most one user question at a time.
6. If the project was missing from `AGENTS.md` and the user supplies it, ask after that answer whether they want the durable project mapping added to `AGENTS.md`.
7. Do not enter plan mode while any critical field or decomposition gap remains unresolved.

**Plan mode is required.** Present the full plan before creating the issue. The plan must include:

- selected issue kind and why
- issue type: feature, bug, or decomposition
- resolved project, milestone, assignee, and cycle
- when the team is `Studio`, `Roadmap`, or `Utilities`: the selected `User Flow` child label and why it was chosen (or the explicit user-approved exception)
- whether the project came from `AGENTS.md`, repo/Linear resolution, or direct user input
- dedupe result
- issue draft outline
- decomposition approach when scope is too large for one issue

**Issue body contract:**

- Product-level only. No file paths, modules, or architecture.
- Use this structure:

```md
## Problem
...

## Goal
...

## Non-goals
- ...

## Acceptance Criteria
- [ ] ...

## Risks
- ...

## Test Notes
- ...
```

**Resolution rules:**

- Dedupe before creating.
- Never create without a project, milestone, assignee, and cycle unless the user explicitly approves the exception.
- For the `Studio`, `Roadmap`, and `Utilities` teams, never create without a single `User Flow` child label unless the user explicitly approves the exception. Read the child-label list live each time; do not hard-code it.
- Decompose by end-to-end slice, not by frontend/backend split.
- Use literal Markdown in `description`; never send escaped `\n` or escaped checkboxes.
- When confirming resolved fields, state the provisional defaults explicitly instead of silently applying them.

## Common Mistakes

- Asking the user for scope details the codebase already answers.
- Entering plan mode before project, milestone, assignee, cycle, or decomposition gaps are resolved.
- Picking a past milestone when future milestones exist.
- Silently defaulting assignee or cycle without user confirmation.
- Creating an issue in the `Studio`, `Roadmap`, or `Utilities` team without a `User Flow` child label, or silently defaulting to one without user confirmation.
- Asking to update `AGENTS.md` before the user has supplied a missing project.
- Creating the issue immediately after drafting instead of waiting for plan approval.
- Writing implementation details into the issue description.

- [`references/linear-operations.md`](references/linear-operations.md) — required MCP tools and fallback policy
