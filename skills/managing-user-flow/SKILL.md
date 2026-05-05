---
name: managing-user-flow
description: >-
  Use when adding, retiring, renaming, merging, or splitting a canonical user
  flow in the User-Flows-Details Sheet and its paired Linear "User Flow" label.
  Flow list maintenance only — does not author functional specs or track implementation.
argument-hint: "add|retire|rename|merge|split [canonical-id(s)]"
---

# Managing User Flows

## When to Use

Trigger conditions:

- User asks to add a new canonical user flow to the Flow Inventory
- User asks to retire an existing flow (update col H to `retired`)
- User asks to rename a canonical ID in col B (and optionally update col E title)
- User asks to merge two flows into one new flow
- User asks to split one flow into two new flows

Not this skill:

- Does not create `docs/functional/` folders or author functional specs
- Does not file or track implementation Linear issues
- Does not edit any sheet column other than B, C, D, E, H, K, M

## Checklist

- [ ] Phase 0 — Preflight (gws auth, load sheet, load Linear labels)
- [ ] Phase 1 — Identify operation and arguments
- [ ] Phase 2 — Validate inputs
- [ ] Phase 3 — Change Preview (show all changes, await approval)
- [ ] Phase 4 — Execute changes
- [ ] Phase 5 — Confirm outputs

## Phase 0 — Preflight

1. Verify `gws` is installed and `gws auth status` exits zero. If not, abort: `Run gws auth login first, then retry.` (see `references/sheet-ops.md §2`)
2. Load the full Flow Inventory sheet via `references/sheet-ops.md §3`. Cache the result — do not re-fetch mid-invocation.
3. Load all Linear "User Flow" child labels via `mcp__linear__list_issue_labels`. Cache the result.
4. Confirm the operation from the invocation context (argument or user message). If ambiguous, ask once: "Which operation? add / retire / rename / merge / split"

## Phase 1 — Identify Operation and Arguments

Route by operation using this table:

| Operation | Reference | Required args |
|---|---|---|
| add | `references/add.md` | canonical-id, repo, category, title, status, persona |
| retire | `references/retire.md` | canonical-id |
| rename | `references/rename.md` | old-id, new-id (and optionally new-title) |
| merge | `references/merge.md` | id-a, id-b, new-id, new-title |
| split | `references/split.md` | source-id, new-id-1, new-title-1, new-id-2, new-title-2 |

If any required arg is missing, ask the user before proceeding.

## Phases 2–5

Phases 2–5 are operation-specific and delegated to the matching `references/<operation>.md` file. The Phase 3 confirmation gate is universal: present the Change Preview block, wait for "yes" or "confirm", and abort on any other response.

## Safety Rails

- Never write to the sheet without showing the Change Preview and receiving explicit approval ("yes" or "confirm").
- Never delete a sheet row — retire only via col H update (`retired`).
- Never write to col L (Filename HYPERLINK formula — managed by sheet owners).
- Never assume column layout; abort if CSV has fewer than 13 columns (see `references/sheet-ops.md §7`).
- Never create a duplicate canonical ID in the sheet or a duplicate Linear label.
- Valid `status` values: `not-started`, `early`, `feature-complete`, `working`, `parked`, `retired`
- Linear label archiving is always a manual step in Linear settings — the MCP has no archive call.
