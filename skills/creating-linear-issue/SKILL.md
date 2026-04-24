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
| 2 | Resolve `project`, `milestone`, `assignee`, `cycle`, and — only for Studio, Roadmap, and Utilities teams — a `User Flow` child label before asking the user |
| 3 | Confirm resolved fields with the user in one question; ask follow-up questions only for unresolved forks |
| 4 | Enter plan mode and show the full issue draft plan before creating anything |
| 5 | Create or update the issue only after plan approval |

## Implementation

**Tool contract:** use the available Linear MCP tools needed for issue, project, milestone, cycle, label, and comment operations in this workflow. Retry once on tool failure, then stop and report the exact failing step.

**Critical fields are mandatory:** every issue creation flow must resolve and confirm `project`, `milestone`, `assignee`, and `cycle`. When the resolved Linear team is `Studio`, `Roadmap`, or `Utilities`, a single `User Flow` child label is also a critical mandatory field. For every other team, `User Flow` is not a critical field even when the workspace contains a `User Flow` parent label.

Defaults are resolved values. When `assignee` defaults to the issue creator and `cycle` defaults to the current cycle, include those values in the resolved field set and the confirmation question; do not report them as unassigned just because the user omitted them.

**Classification is required before planning:**

| Kind | Use when | Issue must capture |
|---|---|---|
| `feature` | Net-new functionality or capability changes | User outcome, scope, acceptance criteria, rollout constraints |
| `bug` | Regression, defect, broken behavior, or incorrect output | Symptom, impact, repro, severity, fix acceptance criteria |
| `spike` | Research, design, investigation, or documentation-driven discovery | Question to answer, research boundary, deliverable, exit criteria |

**Clarification protocol:**

1. Search the codebase first.
2. Resolve the critical fields before asking the user:

   | Field | Resolution rule | If unresolved |
   |---|---|---|
   | `project` | Check `AGENTS.md` first. If it gives one clear project, use that provisional choice; otherwise inspect Linear projects and repo context. | Ask the user. |
   | `milestone` | Load milestones for the resolved project. Ignore past milestones. Prefer one clear future milestone. | If multiple viable future milestones remain, ask the user to choose. |
   | `assignee` | Default to the issue creator unless the request or repo context clearly points elsewhere. | Ask only when context conflicts. |
   | `cycle` | Default to the current cycle unless the request clearly points elsewhere. | Ask only when context conflicts. |
   | `User Flow` child label | Required only for `Studio`, `Roadmap`, and `Utilities`. Apply the decision table below. | Ask for a child label or explicit exception when required and no clear match exists. |

   | User Flow case | Rule |
   |---|---|
   | Team is not `Studio`, `Roadmap`, or `Utilities` | Skip `User Flow` resolution entirely: do not read child labels, recommend alternatives, or include a `User Flow` field in confirmation. |
   | Team is `Studio`, `Roadmap`, or `Utilities` | Read current child labels live from Linear; never hard-code them. For exact query mechanics, read `references/linear-operations.md`. |
   | One clear match | Propose exactly one recommended child label by matching issue title and scope against candidate names and descriptions. |
   | Multiple close matches | Recommend one label and list close alternatives in the same confirmation question so the user can override. |
   | No clear match | Ask the user to pick from current child labels or explicitly approve creating without one. |
   | Enforcing team exception | Never silently omit the label; confirmation must include a selected/recommended child label or explicit exception approval. |
3. Present the resolved values and ask the user to confirm or correct them before entering plan mode. The single confirmation question must include `project`, `milestone` or viable future milestone choices, `assignee`, `cycle`, and, when the team is `Studio`, `Roadmap`, or `Utilities`, the proposed `User Flow` child label or the explicit exception choice.
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
- Scoping the `User Flow` label query to the issue's team, or filtering by label `name` of `User Flow` — both return no child labels. Query at the workspace level and filter by parent label.
- Asking to update `AGENTS.md` before the user has supplied a missing project.
- Creating the issue immediately after drafting instead of waiting for plan approval.
- Writing implementation details into the issue description.

- [`references/linear-operations.md`](references/linear-operations.md) — required MCP tools, fallback policy, and `User Flow` label-resolution mechanics (workspace-level list, parent-label filter)
