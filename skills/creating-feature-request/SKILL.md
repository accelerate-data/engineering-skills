---
name: creating-feature-request
description: >-
  Use when the user asks to create, log, file, draft, or request a product
  feature, feature request, FR, roadmap item, product request, or new product
  capability in Linear.
version: 3.1.0
---

# Creating Feature Request

## Overview

Create a product feature request in Linear's Roadmap team (`RO`). This skill is a Linear workflow, not a form-template generator: resolve live Linear metadata, attach the correct canonical User Flow child label, preview the issue, and create it only after user confirmation.

## When to Use

- User asks to create, log, file, draft, or request a feature request.
- The request is product-facing and belongs in the Roadmap team.
- Do not use for implementation tickets, PR work, bug reports, or closing work.

## Workflow

| Step | Requirement |
|---|---|
| 1 | Parse the user request into title, problem, desired outcome, priority, estimate, and obvious product area |
| 2 | Query live Linear metadata for the Roadmap team: projects, labels, statuses, and candidate User Flow child labels |
| 3 | Resolve one canonical User Flow child label using the same matching rules as `creating-linear-issue` |
| 4 | Stop and ask the user to choose when no User Flow label clearly fits |
| 5 | Resolve priority, estimate, project, status, and useful labels from live Linear metadata |
| 6 | Show a concise Linear issue preview |
| 7 | Create the Linear issue only after user confirmation |

## User Flow Tag

Every feature request created by this skill needs one User Flow child label.

Use the same lookup mechanics as `creating-linear-issue/references/linear-operations.md`:

- query labels at workspace scope
- keep labels whose parent label name is `User Flow`
- match candidate names and descriptions against the request title, product area, and user outcome
- propose exactly one label when one clear match exists
- list close alternatives when several are plausible
- ask the user to pick from current child labels when no clear match exists
- never hard-code User Flow label names

Do not create the feature request until the User Flow label is confirmed.

## Linear Fields

Use live Linear metadata instead of hard-coded adapter-specific tool names or YAML payloads.

| Field | Rule |
|---|---|
| Team | Always Roadmap (`RO`) |
| Title | Action-oriented, under 80 characters when practical |
| Priority | Use user-provided priority when present; otherwise default to Normal |
| Estimate | Use user-provided size/effort when present; otherwise default to S |
| Project | Choose the best Roadmap project from live Linear projects |
| Status | Use the team's triage or backlog-like state from live statuses |
| Labels | Include `feature`, the confirmed User Flow child label, and any matching scope/persona labels from live metadata |

If Linear metadata cannot be loaded, stop before creation and report the missing metadata. Do not fall back to stale hard-coded project, label, or status names for feature-request creation.

## Preview and Confirmation

Before creating the issue, show a concise preview:

- title
- Roadmap team
- project
- priority and estimate
- status
- labels, including User Flow
- description sections that will be sent to Linear

Ask the user to confirm or adjust. Apply natural-language adjustments and show the updated preview again.

## Description

Keep the Linear description product-level. Include:

```md
## Description
...

## User Outcome
...

## Business Rationale
...
```

## Creation

After confirmation, create the issue with the available Linear issue-creation tool. Confirm success with the Linear issue identifier and URL.

## Stop Conditions

- The request is too vague to draft a title and user outcome.
- Live Linear metadata for Roadmap cannot be loaded.
- No User Flow child label is confirmed.
- The user has not confirmed the preview.
- The Linear create operation fails after one retry.
