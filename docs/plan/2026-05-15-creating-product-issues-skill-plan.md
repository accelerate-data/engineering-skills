# `creating-product-issues` Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new `creating-product-issues` skill to `engineering-skills` that files product issues into Linear's Studio or Utilities team, with no project/milestone/cycle, owner resolved from a static team-to-owner map, and full eval coverage.

**Architecture:** A new skill under `skills/creating-product-issues/` with one `SKILL.md` and two new references (`field-resolution.md`, `linear-operations.md`). The skill cross-links three references from the sibling `creating-linear-issue` skill (`bug-intake.md`, `issue-breakdown.md`, `issue-drafting.md`) using relative paths. A new eval package at `tests/evals/packages/creating-product-issues/` carries one smoke test and five scenarios using a custom assertion contract. A thin `commands/creating-product-issues.md` slash-command wrapper, a one-line `AGENTS.md` Skills addition, and a `docs/user-guide/creating-product-issues.md` page complete the change.

**Tech Stack:** Markdown skill content, promptfoo with `@accelerate-data/promptfoo-eval-harness`, Node.js (CommonJS) for the assertion contract, Python validators already shipped with the repo (`validate_plugin_manifests.py`, `check_skill_prose_wraps.py`).

**Branch / worktree:** All work happens on `feat/creating-product-issues-skill` in the worktree at `/Users/shwetanksheel/scratch/ad-plugins/worktrees/feat/creating-product-issues-skill`. Every `git` command in this plan must run from that worktree.

**Design source:** `docs/superpowers/specs/2026-05-15-creating-product-issues-skill-design.md` (commit `b648ef5`).

**Minor deviation from spec (no behavioral impact):** the new SKILL.md additionally cross-links `../creating-linear-issue/references/issue-drafting.md` (in addition to `bug-intake.md` and `issue-breakdown.md` called out in the spec) because the draft body template is generic and copying it would be pure duplication. The Issue Draft section in the new SKILL.md still inlines the simplified field list so the new skill's smaller draft-approval surface (team, owner, User Flow label only) does not depend on the source skill's project/milestone/cycle wording.

---

## File Structure

### Files to create

| Path | Responsibility |
|---|---|
| `skills/creating-product-issues/SKILL.md` | Skill frontmatter + workflow, gates, source-context, draft, references |
| `skills/creating-product-issues/references/field-resolution.md` | Issue kind, team allowlist, static team-to-owner map, User Flow rule, confirmation |
| `skills/creating-product-issues/references/linear-operations.md` | Linear MCP usage, User Flow child-label lookup, owner-by-email lookup |
| `tests/evals/prompts/skill-creating-product-issues.txt` | Promptfoo prompt template (Jinja-style, two branches: routing and workflow) |
| `tests/evals/assertions/check-creating-product-issues-contract.js` | Custom contract validator |
| `tests/evals/packages/creating-product-issues/promptfooconfig.json` | Promptfoo config: 1 smoke + 5 scenarios |
| `commands/creating-product-issues.md` | Slash-command wrapper delegating to the skill |
| `docs/user-guide/creating-product-issues.md` | AD engineer-facing user guide |

### Files to modify

| Path | Change |
|---|---|
| `package.json` (repo root) | Add `eval:creating-product-issues` script |
| `tests/evals/package.json` | Add `eval:creating-product-issues` script |
| `AGENTS.md` | Add one line to the `## Skills` section |

### Files NOT to touch

- `skills/creating-linear-issue/**` — referenced via relative paths only; do not modify.
- `tests/evals/skill-eval-coverage-baseline.json` — `uncovered_skills` should remain `[]`; the new eval package covers the new skill.

---

## Task 1: Scaffold skill directory and write the SKILL.md

**Files:**
- Create: `skills/creating-product-issues/SKILL.md`
- Create: `skills/creating-product-issues/references/` (empty directory; populated in later tasks)

- [ ] **Step 1: Create the references directory**

Run:

```bash
mkdir -p skills/creating-product-issues/references
```

- [ ] **Step 2: Write `skills/creating-product-issues/SKILL.md`**

Full file content:

```markdown
---
name: creating-product-issues
description: >-
  Use when filing, logging, raising, reporting, or submitting a product issue,
  feature request, bug, or feedback for the Studio or Utilities product areas
  in Linear.
argument-hint: "[request-or-issue-context]"
---

# Creating Product Issues

## Overview

Turn a product request into a clear Linear issue in the `Studio` or `Utilities` team only, after repo discovery, field resolution, source-doc review, user confirmation, and draft approval. The team owner is resolved from a static team-to-owner map. No `project`, `milestone`, or `cycle` is assigned.

## When to Use

- User asks to file, log, raise, report, or submit a product issue, feature request, bug, or feedback for the Studio or Utilities product areas.
- The request needs Linear metadata, source context, or decomposition before it can be safely filed.
- Do not use for implementation, PR raising, merge, closeout, or cleanup.
- Do not use for engineering-team issues — use `creating-linear-issue` for those.

## Workflow

| Step | Requirement |
|---|---|
| 1 | Classify the request as `feature`, `bug`, or `spike` |
| 2 | Search the codebase and existing Linear issues before asking the user |
| 3 | Resolve `team` (must be `Studio` or `Utilities`), User Flow child label, and `owner` from the static team-to-owner map in `references/field-resolution.md` |
| 4 | Read the matching functional spec before issue creation |
| 5 | Search and read related design docs; record `not_applicable` when none are related |
| 6 | Use `superpowers:brainstorming` when a feature is broad, non-trivial, or still has product forks |
| 7 | Use `../creating-linear-issue/references/bug-intake.md` for bug issues |
| 8 | Use `../creating-linear-issue/references/issue-breakdown.md` when the request is too large for one issue |
| 9 | Confirm resolved fields (team, owner, User Flow label) with the user in one question |
| 10 | Show the issue draft and create/update only after approval |

## Hard Gates

- Stop if the resolved team is anything other than `Studio` or `Utilities`. Explain that this skill files product issues only into Studio or Utilities, and ask the user to email `ss@acceleratedata.ai` if the right target is unclear.
- Stop if no User Flow child label is confirmed for the resolved team. The label is required for downstream triage.
- Do not draft while team resolution, User Flow label, owner resolution, brainstorming outcomes, bug-intake gaps, decomposition gaps, functional spec, or related design docs remain unresolved.
- Do not ask the user for details the codebase, functional spec, design docs, or existing Linear issues already answer.
- Do not set `project`, `milestone`, or `cycle` on the filed issue.

## Source Context

For all issues filed by this skill (both Studio and Utilities require it):

- read the functional spec before drafting
- search `docs/design/` by User Flow label, feature name, domain terms, and linked-document titles
- cite the functional spec path and related design doc paths in the Linear description for downstream implementation traceability

## Issue Draft

Show the full draft before creating or updating the issue. Include:

- selected issue kind and why
- resolved team, owner, and User Flow label
- functional spec path and related design doc paths, or `not_applicable`
- brainstorming summary for non-trivial feature scope when applicable
- bug-intake summary for bug issues when applicable
- dedupe result
- issue draft outline
- decomposition approach when scope is too large for one issue

Create or update the Linear issue only after user approval.

### Body Template

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

Include the functional spec path and related design doc paths in the description so triage and implementation can trace source context. Do not include `project`, `milestone`, or `cycle` fields.

## Linear Operations

Use available Linear MCP tools for issue, label, and comment operations. Retry once on tool failure, then stop and report the exact failing step.

Read `references/linear-operations.md` for User Flow child-label lookup and owner-by-email lookup mechanics.

## Common Mistakes

- Filing into a team other than `Studio` or `Utilities`.
- Setting `project`, `milestone`, or `cycle` fields (the skill explicitly does not).
- Resolving owner from the user running the skill instead of the static team-to-owner map.
- Filing without a User Flow label or matching functional spec.
- Turning the feature request into an implementation plan.

## References

- [`references/field-resolution.md`](references/field-resolution.md) — issue kind, team allowlist, static team-to-owner map, User Flow rule, and confirmation question
- [`references/linear-operations.md`](references/linear-operations.md) — Linear MCP tool policy, User Flow child-label lookup, and owner-by-email lookup
- [`../creating-linear-issue/references/issue-drafting.md`](../creating-linear-issue/references/issue-drafting.md) — draft approval content and issue body template (shared with `creating-linear-issue`)
- [`../creating-linear-issue/references/issue-breakdown.md`](../creating-linear-issue/references/issue-breakdown.md) — vertical-slice decomposition (shared)
- [`../creating-linear-issue/references/bug-intake.md`](../creating-linear-issue/references/bug-intake.md) — bug issue intake checks (shared)
```

- [ ] **Step 3: Verify the file lints**

Run:

```bash
markdownlint skills/creating-product-issues/SKILL.md
```

Expected: no output (clean). If the local environment lacks `markdownlint`, install with `brew install markdownlint-cli` and rerun.

- [ ] **Step 4: Run the prose-wrap validator**

Run:

```bash
npm run check:skill-prose-wraps
```

Expected: passes (the validator inspects all skill files; the new file should not introduce wrap violations).

- [ ] **Step 5: Commit**

Run:

```bash
git add skills/creating-product-issues/SKILL.md
git commit -m "feat(creating-product-issues): scaffold skill with SKILL.md"
```

---

## Task 2: Write `field-resolution.md`

**Files:**
- Create: `skills/creating-product-issues/references/field-resolution.md`

- [ ] **Step 1: Write the reference**

Full file content:

```markdown
# Field Resolution

Use this reference after codebase and duplicate-issue search, before issue drafting.

## Issue Kind

| Kind | Use when | Issue must capture |
|---|---|---|
| `feature` | Net-new functionality or capability changes | User outcome, scope, acceptance criteria, rollout constraints |
| `bug` | Regression, defect, broken behavior, or incorrect output | Symptom, impact, expected vs actual behavior, repro, consistency, severity, fix acceptance criteria |
| `spike` | Research, design, investigation, or documentation-driven discovery | Question to answer, research boundary, deliverable, exit criteria |

## Team Allowlist

This skill creates issues only in two Linear teams:

| Team | Owner | Email |
|---|---|---|
| Studio | Umesh Kakkad (UK) | uk@acceleratedata.ai |
| Utilities | Hemanta Banerjee (HB) | hb@acceleratedata.ai |

If the resolved team is anything other than `Studio` or `Utilities`, stop. Explain the allowlist and ask the user to email `ss@acceleratedata.ai` if the right target is unclear.

## Critical Fields

| Field | Resolution rule | If unresolved |
|---|---|---|
| `team` | From the request or the user's confirmation. Must be `Studio` or `Utilities`. | Stop and ask the user to pick from the allowlist. |
| `owner` | Look up the email for the resolved team in the table above; resolve the Linear user from that email. | Stop and report the failing user-by-email lookup. |
| `User Flow` child label | Required for both `Studio` and `Utilities`. | Ask for a child label when no clear match exists. |

Do **not** resolve `project`, `milestone`, or `cycle`. This skill explicitly does not set those fields.

## User Flow Rule

| Case | Rule |
|---|---|
| One clear match | Propose exactly one child label by matching title and scope against candidate names and descriptions. |
| Multiple close matches | Recommend one label and list close alternatives in the same confirmation question. |
| No match | Ask the user to pick from current child labels before drafting. |
| Functional spec missing | Stop before drafting and ask the user to author the functional spec first. |

Read `linear-operations.md` for lookup mechanics.

## Confirmation

Ask at most one user question at a time.

The field-confirmation question includes:

- `team` (Studio or Utilities)
- `owner` (the resolved Linear user from the static map)
- `User Flow` child label and functional spec path

Do not include `project`, `milestone`, or `cycle` in the confirmation question — those fields are intentionally absent from product issues.
```

- [ ] **Step 2: Lint and prose-wrap check**

Run:

```bash
markdownlint skills/creating-product-issues/references/field-resolution.md
npm run check:skill-prose-wraps
```

Expected: both clean.

- [ ] **Step 3: Commit**

Run:

```bash
git add skills/creating-product-issues/references/field-resolution.md
git commit -m "feat(creating-product-issues): add field-resolution reference"
```

---

## Task 3: Write `linear-operations.md`

**Files:**
- Create: `skills/creating-product-issues/references/linear-operations.md`

- [ ] **Step 1: Write the reference**

Full file content:

```markdown
# Linear Operations

Execute Linear operations directly by default using MCP tools. Use sub-agents only when parallel research is required.

## Workflow Contract

- Use the available Linear MCP tools needed for the current workflow.
- Prefer direct MCP operations over sub-agents unless parallel research is required.
- If a required tool fails after one retry, stop and report the exact failing step.

## User Flow Child Labels

The main skill owns the enforcement rule. This reference owns the Linear lookup mechanics.

| Operation | Rule |
|---|---|
| Team scope | Applies for both `Studio` and `Utilities`. |
| Runtime lookup | Resolve child labels at runtime with the available Linear MCP label-listing tool. |
| Query scope | Query at workspace scope, not team scope. `User Flow` labels are workspace labels; team-scoped queries can miss them. |
| Parent filter | Do not query with `name: "User Flow"`; that returns the parent label. List labels without a name filter, then keep labels whose parent label name is `User Flow`. |
| Matching inputs | Match each candidate's name and description against the issue title and scope. |
| Recommendation | Propose exactly one child label when one clear match exists. |
| Close alternatives | If multiple candidates are close, list alternatives beside the recommendation in the field-confirmation question. |
| No clear match | Ask the user to pick from the current child-label list before drafting. Do not create an issue without a child label. |
| Hard-coding | Never hard-code child-label names; they can grow or be renamed in Linear. |

## Owner Resolution

Owner is resolved from the static team-to-owner map in `field-resolution.md`, not from a Linear team default-owner field.

| Operation | Rule |
|---|---|
| Lookup source | The email for the resolved team comes from the `field-resolution.md` allowlist (`uk@acceleratedata.ai` for Studio, `hb@acceleratedata.ai` for Utilities). |
| User resolution | Resolve the Linear user from that email using the available Linear MCP user-lookup tool (e.g., `mcp__claude_ai_Linear__list_users` filtered by email, or `mcp__claude_ai_Linear__get_user`). |
| Failure handling | If the user-by-email lookup fails, retry once. If the second call also fails, stop and report the exact failing call. Do not fall back to leaving the issue unassigned and do not fall back to the issue creator. |
| Hard-coding | Do not hard-code Linear user IDs; always resolve at runtime from the email. |

## Excluded Fields

Do not call any Linear MCP operation that sets `project`, `milestone`, or `cycle` on issues created by this skill. The skill's draft and the create-issue payload must omit those fields.
```

- [ ] **Step 2: Lint and prose-wrap check**

Run:

```bash
markdownlint skills/creating-product-issues/references/linear-operations.md
npm run check:skill-prose-wraps
```

Expected: both clean.

- [ ] **Step 3: Commit**

Run:

```bash
git add skills/creating-product-issues/references/linear-operations.md
git commit -m "feat(creating-product-issues): add linear-operations reference"
```

---

## Task 4: Write the eval prompt

**Files:**
- Create: `tests/evals/prompts/skill-creating-product-issues.txt`

- [ ] **Step 1: Write the prompt**

The prompt is a Jinja-style template with two branches: a routing branch (when `user_message` is set) and a workflow branch (when `user_prompt` and `simulated_context` are set). Modeled on `tests/evals/prompts/skill-creating-linear-issue.txt`, adapted for the product-issues behavior.

Full file content:

```text
You are evaluating a skill workflow in this repository.

{% if user_message %}
You are an agent responding to a user message mid-conversation. Choose the next
skill using only the available skill descriptions, not AGENTS.md or CLAUDE.md
routing rules.

Available skills and their descriptions:

- creating-product-issues: Use when filing, logging, raising, reporting, or
  submitting a product issue, feature request, bug, or feedback for the Studio
  or Utilities product areas in Linear.
- creating-linear-issue: Use when the user asks to create, file, log, open,
  draft, refine, decompose, or turn a request, bug, spike, or follow-up into a
  Linear issue or Linear ticket before work continues.
- linear: Manage issues, projects, and team workflows in Linear. Use when the
  user wants to read, create, or update tickets in Linear.

Do not read Linear, write Linear, contact Linear, or call Linear tools. All
required Linear facts are supplied in the scenario and simulated context. If a
required Linear fact is missing from the scenario, report that the fixture is
incomplete instead of trying to fetch it.

The user now says:
"{{user_message}}"

Analyze which skill should be triggered next.

This routing branch is classification-only. Return JSON only with this shape:

{
  "detected_skill": "creating-product-issues | creating-linear-issue | linear | none",
  "trigger_found_in_message": <bool>,
  "would_pause_current_flow": <bool>,
  "reason": "string"
}

Use exactly one of these string values for detected_skill: "creating-product-issues", "creating-linear-issue", "linear", or "none".
{% else %}
Read the skill at `skills/creating-product-issues/SKILL.md` and its references.

This is a read-only workflow eval. Do not create a Linear issue, contact Linear,
modify files, or perform any external action.

Do not read Linear, query Linear, write Linear, create Linear issues, update
Linear issues, contact Linear, or call Linear tools. All required Linear facts
are supplied in the scenario and simulated context. If a required Linear fact is
missing from the scenario, report that the fixture is incomplete instead of
trying to fetch it.

When the skill would normally read local files or Linear metadata, treat the
simulated context below as the discovered evidence. Report whether the workflow
requires those lookup steps for this scenario; do not perform the lookups.

The user says:

> {{ user_prompt }}

Simulated context:

{{ simulated_context }}

Based on the skill, report the next workflow obligations for this scenario. Do
not mark something true only because the skill supports it in another scenario.

Return one valid JSON object with exactly these keys:

{
  "team_name": "string",
  "team_in_allowlist": <bool>,
  "stops_on_off_list_team": <bool>,
  "issue_kind": "feature | bug | spike",
  "resolved_owner_email": "string",
  "resolves_owner_from_static_map": <bool>,
  "looks_up_linear_user_by_email": <bool>,
  "stops_on_owner_email_lookup_failure": <bool>,
  "sets_project": <bool>,
  "sets_milestone": <bool>,
  "sets_cycle": <bool>,
  "requires_user_flow_label": <bool>,
  "reads_user_flow_labels_live": <bool>,
  "proposes_user_flow_child_label": <bool>,
  "asks_user_to_pick_user_flow": <bool>,
  "lists_close_alternatives_in_confirmation": <bool>,
  "reads_functional_spec_before_issue_creation": <bool>,
  "stops_if_functional_spec_missing": <bool>,
  "searches_related_design_docs": <bool>,
  "uses_brainstorming_for_non_trivial_feature": <bool>,
  "uses_issue_breakdown_reference": <bool>,
  "uses_bug_intake_reference": <bool>,
  "captures_expected_actual_repro_consistency": <bool>,
  "confirms_critical_fields_with_user": <bool>,
  "creates_issue_before_plan_approval": <bool>,
  "issue_body_references_functional_spec": <bool>,
  "issue_body_references_design_doc": <bool>,
  "notes": "string"
}

Use booleans for boolean fields and strings for string fields. `issue_kind` must
be one of `feature`, `bug`, or `spike`. Use exactly the key names shown above.

Do not include commentary, markdown fences, refusal text, or prefaces before or
after the JSON object. The first character of your response must be `{` and the
last character must be `}`.
{% endif %}
```

- [ ] **Step 2: Commit**

Run:

```bash
git add tests/evals/prompts/skill-creating-product-issues.txt
git commit -m "test(creating-product-issues): add eval prompt"
```

---

## Task 5: Write the assertion contract

**Files:**
- Create: `tests/evals/assertions/check-creating-product-issues-contract.js`

This contract reuses the pattern from `check-explaining-code-contract.js`: any test var prefixed `expect_` becomes a JSON-field assertion. It also adds two special-case checks: `expected_issue_kind` (string equality on `issue_kind`) and `expected_team_name` (string equality on `team_name`).

- [ ] **Step 1: Write the assertion file**

Full file content:

```javascript
const { extractJsonObject } = require('./schema-helpers');

function parseExpectedBoolean(value) {
  if (value === undefined) return null;
  return String(value).trim().toLowerCase() === 'true';
}

function expectedFieldName(varName) {
  if (!varName.startsWith('expect_')) return null;
  return varName.slice('expect_'.length);
}

module.exports = (output, context) => {
  let payload;
  try {
    payload = extractJsonObject(output);
  } catch (error) {
    return { pass: false, score: 0, reason: `Failed to parse JSON output: ${error.message}` };
  }

  const vars = context.vars || {};

  if (vars.expected_issue_kind !== undefined) {
    const expected = String(vars.expected_issue_kind).trim().toLowerCase();
    const actual = String(payload.issue_kind || '').trim().toLowerCase();
    if (actual !== expected) {
      return {
        pass: false,
        score: 0,
        reason: `Expected issue_kind=${expected}, got ${actual}`,
      };
    }
  }

  if (vars.expected_team_name !== undefined) {
    const expected = String(vars.expected_team_name).trim();
    const actual = String(payload.team_name || '').trim();
    if (actual !== expected) {
      return {
        pass: false,
        score: 0,
        reason: `Expected team_name=${expected}, got ${actual}`,
      };
    }
  }

  if (vars.expected_resolved_owner_email !== undefined) {
    const expected = String(vars.expected_resolved_owner_email).trim().toLowerCase();
    const actual = String(payload.resolved_owner_email || '').trim().toLowerCase();
    if (actual !== expected) {
      return {
        pass: false,
        score: 0,
        reason: `Expected resolved_owner_email=${expected}, got ${actual}`,
      };
    }
  }

  if (vars.expected_detected_skill !== undefined) {
    const expected = String(vars.expected_detected_skill).trim().toLowerCase();
    const actual = String(payload.detected_skill || '').trim().toLowerCase();
    if (actual !== expected) {
      return {
        pass: false,
        score: 0,
        reason: `Expected detected_skill=${expected}, got ${actual}`,
      };
    }
  }

  for (const [varName, varValue] of Object.entries(vars)) {
    const field = expectedFieldName(varName);
    if (!field) continue;
    const expected = parseExpectedBoolean(varValue);
    if (expected === null) continue;
    if (payload[field] !== expected) {
      return {
        pass: false,
        score: 0,
        reason: `Expected ${field}=${expected}, got ${payload[field]}`,
      };
    }
  }

  return { pass: true, score: 1, reason: 'creating-product-issues contract matched expected behavior' };
};
```

- [ ] **Step 2: Sanity-check the contract loads as a Node module**

Run:

```bash
node -e "require('./tests/evals/assertions/check-creating-product-issues-contract.js'); console.log('ok')"
```

Expected: `ok`. If it fails, fix the syntax and rerun.

- [ ] **Step 3: Commit**

Run:

```bash
git add tests/evals/assertions/check-creating-product-issues-contract.js
git commit -m "test(creating-product-issues): add assertion contract"
```

---

## Task 6: Write the eval package config

**Files:**
- Create: `tests/evals/packages/creating-product-issues/promptfooconfig.json`

The config ships one smoke test and five scenarios as described in spec §5.2.

- [ ] **Step 1: Create the package directory**

Run:

```bash
mkdir -p tests/evals/packages/creating-product-issues
```

- [ ] **Step 2: Write `promptfooconfig.json`**

Full file content:

```json
{
  "description": "creating-product-issues skill — Studio/Utilities-only product issue intake",
  "metadata": {
    "eval_tier": "light"
  },
  "prompts": [
    "file://../../prompts/skill-creating-product-issues.txt"
  ],
  "defaultTest": {
    "assert": [
      {
        "type": "javascript",
        "value": "file://../../assertions/check-creating-product-issues-contract.js"
      }
    ]
  },
  "tests": [
    {
      "description": "[smoke] golden path — Studio feature request",
      "vars": {
        "eval_type": "user-behavior",
        "failure_modes": "files-into-wrong-team,sets-project-or-milestone-or-cycle,skips-owner-static-map",
        "user_prompt": "File a product issue for adding a 'duplicate dashboard' shortcut on the Studio dashboard list.",
        "simulated_context": "- The resolved Linear team is `Studio`.\n- Simulated Linear label metadata found one matching User Flow child label, `UF-Dashboard-Management`.\n- `docs/functional/UF-Dashboard-Management/README.md` exists.\n- No related design document was found after searching `docs/design/`.\n- Codebase search found the existing dashboard list surface.\n- The Linear user-by-email lookup for `uk@acceleratedata.ai` succeeds and resolves to Umesh Kakkad.\n",
        "expected_team_name": "Studio",
        "expected_issue_kind": "feature",
        "expected_resolved_owner_email": "uk@acceleratedata.ai",
        "expect_team_in_allowlist": "true",
        "expect_resolves_owner_from_static_map": "true",
        "expect_looks_up_linear_user_by_email": "true",
        "expect_sets_project": "false",
        "expect_sets_milestone": "false",
        "expect_sets_cycle": "false",
        "expect_requires_user_flow_label": "true",
        "expect_reads_user_flow_labels_live": "true",
        "expect_proposes_user_flow_child_label": "true",
        "expect_reads_functional_spec_before_issue_creation": "true",
        "expect_confirms_critical_fields_with_user": "true",
        "expect_creates_issue_before_plan_approval": "false",
        "expect_issue_body_references_functional_spec": "true"
      }
    },
    {
      "description": "off-list team — request resolves to a team outside Studio/Utilities",
      "vars": {
        "eval_type": "user-behavior",
        "failure_modes": "files-into-wrong-team",
        "user_prompt": "File a product issue for a finance approval workflow.",
        "simulated_context": "- The resolved Linear team is `Finance`.\n- The user has not asked to file into Studio or Utilities.\n- No User Flow child labels have been queried because the team is off-list.\n",
        "expected_team_name": "Finance",
        "expect_team_in_allowlist": "false",
        "expect_stops_on_off_list_team": "true",
        "expect_creates_issue_before_plan_approval": "false",
        "expect_sets_project": "false",
        "expect_sets_milestone": "false",
        "expect_sets_cycle": "false"
      }
    },
    {
      "description": "bug intake — Utilities bug needs expected/actual/repro/consistency",
      "vars": {
        "eval_type": "user-behavior",
        "failure_modes": "skips-bug-intake,sets-project-or-milestone-or-cycle",
        "user_prompt": "File a bug: the Utilities bulk-rename action sometimes leaves the old name visible until refresh.",
        "simulated_context": "- The resolved Linear team is `Utilities`.\n- Simulated Linear label metadata found one matching User Flow child label, `UF-Utilities-Bulk-Actions`.\n- `docs/functional/UF-Utilities-Bulk-Actions/README.md` exists.\n- The user gave actual behavior, but expected behavior, exact reproduction, and consistency need to be captured.\n- The Linear user-by-email lookup for `hb@acceleratedata.ai` succeeds and resolves to Hemanta Banerjee.\n",
        "expected_team_name": "Utilities",
        "expected_issue_kind": "bug",
        "expected_resolved_owner_email": "hb@acceleratedata.ai",
        "expect_team_in_allowlist": "true",
        "expect_uses_bug_intake_reference": "true",
        "expect_captures_expected_actual_repro_consistency": "true",
        "expect_sets_project": "false",
        "expect_sets_milestone": "false",
        "expect_sets_cycle": "false"
      }
    },
    {
      "description": "oversized request — multiple independent features need decomposition",
      "vars": {
        "eval_type": "user-behavior",
        "failure_modes": "implements-before-brainstorming,misses-required-handoff",
        "user_prompt": "File product issues for a new Studio reporting workspace: scheduled exports, shared filters, audit log, and a digest email.",
        "simulated_context": "- The resolved Linear team is `Studio`.\n- Simulated Linear label metadata found one matching User Flow child label, `UF-Studio-Reporting-Workspace`.\n- `docs/functional/UF-Studio-Reporting-Workspace/README.md` exists.\n- The scope spans several distinct user outcomes and is too large for one issue.\n- The Linear user-by-email lookup for `uk@acceleratedata.ai` succeeds and resolves to Umesh Kakkad.\n",
        "expected_team_name": "Studio",
        "expect_team_in_allowlist": "true",
        "expect_uses_brainstorming_for_non_trivial_feature": "true",
        "expect_uses_issue_breakdown_reference": "true",
        "expect_creates_issue_before_plan_approval": "false"
      }
    },
    {
      "description": "ambiguous User Flow label — multiple close child labels",
      "vars": {
        "eval_type": "user-behavior",
        "failure_modes": "skips-user-flow,picks-user-flow-without-confirmation",
        "user_prompt": "File a product issue for letting users star dashboards in the Studio sidebar.",
        "simulated_context": "- The resolved Linear team is `Studio`.\n- Simulated Linear label metadata found three close User Flow child labels: `UF-Dashboard-Management` (strongest match), `UF-Studio-Navigation`, and `UF-Favorites` (close alternatives).\n- `docs/functional/UF-Dashboard-Management/README.md` exists.\n- The Linear user-by-email lookup for `uk@acceleratedata.ai` succeeds.\n",
        "expected_team_name": "Studio",
        "expect_team_in_allowlist": "true",
        "expect_proposes_user_flow_child_label": "true",
        "expect_lists_close_alternatives_in_confirmation": "true",
        "expect_creates_issue_before_plan_approval": "false"
      }
    },
    {
      "description": "owner email lookup failure — Linear user-by-email lookup keeps failing",
      "vars": {
        "eval_type": "user-behavior",
        "failure_modes": "ignores-lookup-failure,falls-back-to-creator-or-unassigned",
        "user_prompt": "File a product issue for a Utilities maintenance toggle.",
        "simulated_context": "- The resolved Linear team is `Utilities`.\n- Simulated Linear label metadata found one matching User Flow child label, `UF-Utilities-Maintenance`.\n- `docs/functional/UF-Utilities-Maintenance/README.md` exists.\n- The Linear user-by-email lookup for `hb@acceleratedata.ai` fails on the first call and fails again on the retry.\n",
        "expected_team_name": "Utilities",
        "expect_team_in_allowlist": "true",
        "expect_looks_up_linear_user_by_email": "true",
        "expect_stops_on_owner_email_lookup_failure": "true",
        "expect_creates_issue_before_plan_approval": "false"
      }
    }
  ]
}
```

- [ ] **Step 3: Validate JSON parses**

Run:

```bash
node -e "JSON.parse(require('fs').readFileSync('tests/evals/packages/creating-product-issues/promptfooconfig.json','utf8')); console.log('ok')"
```

Expected: `ok`. Fix any parse errors before continuing.

- [ ] **Step 4: Commit**

Run:

```bash
git add tests/evals/packages/creating-product-issues/promptfooconfig.json
git commit -m "test(creating-product-issues): add eval package with 1 smoke + 5 scenarios"
```

---

## Task 7: Wire eval scripts into both `package.json` files

**Files:**
- Modify: `package.json` (repo root)
- Modify: `tests/evals/package.json`

- [ ] **Step 1: Add the script to `tests/evals/package.json`**

Add this line to the `scripts` block, placed alphabetically between `eval:creating-linear-issue` and `eval:explaining-code` (or any consistent location):

```json
"eval:creating-product-issues": "ad-evals run packages/creating-product-issues/promptfooconfig.json",
```

The final scripts block should contain that key alongside the existing entries.

- [ ] **Step 2: Add the script to the root `package.json`**

Add this line to the `scripts` block, placed alphabetically between `eval:creating-linear-issue` and `eval:implementing-linear-issue`:

```json
"eval:creating-product-issues": "npm --prefix tests/evals run eval:creating-product-issues",
```

- [ ] **Step 3: Validate both `package.json` files still parse**

Run:

```bash
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); JSON.parse(require('fs').readFileSync('tests/evals/package.json','utf8')); console.log('ok')"
```

Expected: `ok`.

- [ ] **Step 4: Verify the eval package is wired**

Run (without actually invoking models; this just confirms the harness sees the package):

```bash
npm --prefix tests/evals run eval:creating-product-issues -- --help 2>&1 | head -5
```

Expected: shows the `ad-evals run` help or proceeds toward execution. A `command not found` or `missing config` error here means the wiring is wrong; fix before continuing.

- [ ] **Step 5: Commit**

Run:

```bash
git add package.json tests/evals/package.json
git commit -m "test(creating-product-issues): wire eval:creating-product-issues script"
```

---

## Task 8: Run the eval package end-to-end

**Files:** (none)

This task runs the actual eval and verifies all 6 tests pass. If any fail, fix the SKILL.md / references / prompt until they do, then re-run.

- [ ] **Step 1: Run the smoke subset**

Run:

```bash
npm run eval:creating-product-issues
```

Expected: all 6 tests in the package pass.

- [ ] **Step 2: If any test fails, diagnose and fix**

Triage path (in order):

1. Read the failing test description and assertion message.
2. If the assertion expected a contract field that the prompt does not emit, update `tests/evals/prompts/skill-creating-product-issues.txt` to add the field to its JSON schema. Commit separately.
3. If the model output is correct but the contract field name does not match, fix the contract var name in `promptfooconfig.json` (the `expect_*` key must equal the JSON field name). Commit separately.
4. If the model output reflects a misunderstanding of the skill, update the relevant section of `SKILL.md` or its references for clarity. Commit separately.

Each fix gets its own commit so the eval-pass commit is clean.

- [ ] **Step 3: Confirm pass and commit (if no fixes needed)**

If no fixes were needed, no commit is required for this task. If fixes were needed, the per-fix commits already cover it.

---

## Task 9: Add the slash-command wrapper

**Files:**
- Create: `commands/creating-product-issues.md`

- [ ] **Step 1: Write the command file**

Full file content:

```markdown
---
description: File a product issue into Linear's Studio or Utilities team.
---

# /creating-product-issues

Invoke `creating-product-issues` to file a product issue into Linear's Studio or Utilities team.

## Usage

- `/creating-product-issues <request>` — file an issue for the described request.
- `/creating-product-issues` — invoke with no request; the skill will ask.

## What this does

Delegates to `Skill("creating-product-issues")`. The skill:

1. Classifies the request as feature, bug, or spike.
2. Searches the codebase and existing Linear issues.
3. Resolves the team (Studio or Utilities only), the User Flow child label, and the owner from the static team-to-owner map.
4. Reads the matching functional spec and related design docs.
5. Confirms team, owner, and User Flow label with the user.
6. Shows the issue draft and creates the Linear issue only after approval.

The filed issue has no `project`, `milestone`, or `cycle` set.
```

- [ ] **Step 2: Lint**

Run:

```bash
markdownlint commands/creating-product-issues.md
```

Expected: clean.

- [ ] **Step 3: Commit**

Run:

```bash
git add commands/creating-product-issues.md
git commit -m "feat(creating-product-issues): add slash-command wrapper"
```

---

## Task 10: Update `AGENTS.md` Skills section

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Add the skill to the Skills list**

In `AGENTS.md`, find the `## Skills` section. Add one line, placed alphabetically (between `closing-linear-issue` and `explaining-code`, or wherever the existing alphabetical order dictates):

```markdown
- `skills/creating-product-issues/SKILL.md` - file a product issue into Linear's Studio or Utilities team
```

Make no other changes to `AGENTS.md`. Do not modify Repo Purpose, Linear, or Conventions sections.

- [ ] **Step 2: Lint**

Run:

```bash
markdownlint AGENTS.md
```

Expected: clean.

- [ ] **Step 3: Commit**

Run:

```bash
git add AGENTS.md
git commit -m "docs(agents): list creating-product-issues skill"
```

---

## Task 11: Author the user guide

**Files:**
- Create: `docs/user-guide/creating-product-issues.md`

This task uses the `doc-skills:authoring-user-guide` skill. The skill knows the user-guide structure; this task drives it with the right inputs.

- [ ] **Step 1: Invoke the user-guide authoring skill**

Open a session and invoke:

```
Skill: doc-skills:authoring-user-guide

Arguments: Author a user guide at docs/user-guide/creating-product-issues.md for
the creating-product-issues skill. Audience: AD engineers. Cover:

- When to use the skill (and when to use creating-linear-issue instead).
- What each hard gate means and what to do when each fires:
  - Off-list team (Studio/Utilities only).
  - Missing User Flow child label.
  - Functional spec missing.
  - Linear user-by-email lookup failure for owner resolution.
- The static team-to-owner map (Studio=Umesh Kakkad, Utilities=Hemanta Banerjee).
- Worked example: filing a Studio feature request from one-line request to filed
  issue.
- The fields the skill explicitly does NOT set (project, milestone, cycle) and why.

Source: skills/creating-product-issues/SKILL.md and its references.
```

Let the skill drive the content. If the skill is unavailable, fall back to authoring the page by hand using the same outline.

- [ ] **Step 2: Lint the new page**

Run:

```bash
markdownlint docs/user-guide/creating-product-issues.md
```

Expected: clean. If the skill produced wrap or list-formatting issues, fix them.

- [ ] **Step 3: Commit**

Run:

```bash
git add docs/user-guide/creating-product-issues.md
git commit -m "docs(user-guide): add creating-product-issues page"
```

---

## Task 12: Full verification suite

**Files:** (none)

Run every check listed in spec §6 and ensure all pass. Fix anything that fails before declaring the work done.

- [ ] **Step 1: Eval coverage**

Run:

```bash
npm run eval:coverage
```

Expected: passes. The `creating-product-issues` skill should not appear in `uncovered_skills`. If it does, the eval package is not being discovered — check directory names and config locations.

- [ ] **Step 2: Codex compatibility**

Run:

```bash
npm run eval:codex-compatibility
```

Expected: passes. This check inspects every eval package for Codex-compatible config; the new package must conform.

- [ ] **Step 3: Plugin manifest validation**

Run:

```bash
npm run validate:plugin-manifests
```

Expected: passes (no manifest changes were made; this is a regression check).

- [ ] **Step 4: Skill prose-wrap check**

Run:

```bash
npm run check:skill-prose-wraps
```

Expected: passes on the new SKILL.md and reference files.

- [ ] **Step 5: Markdownlint on all new files**

Run:

```bash
markdownlint \
  skills/creating-product-issues/SKILL.md \
  skills/creating-product-issues/references/field-resolution.md \
  skills/creating-product-issues/references/linear-operations.md \
  commands/creating-product-issues.md \
  docs/user-guide/creating-product-issues.md \
  AGENTS.md
```

Expected: clean.

- [ ] **Step 6: Re-run the full skill eval one more time**

Run:

```bash
npm run eval:creating-product-issues
```

Expected: all 6 tests pass.

- [ ] **Step 7: Verify git state is clean**

Run:

```bash
git status
git log --oneline main..HEAD
```

Expected: working tree clean; commit log shows the bite-sized commits from Tasks 1–11 plus any fix commits from Task 8.

- [ ] **Step 8: Manual smoke (optional but recommended)**

In a fresh Claude Code session within this worktree, type `/creating-product-issues file a one-line Studio request for testing the skill end-to-end`. Confirm the skill:

1. Classifies the request as a feature.
2. Resolves the team to Studio.
3. Asks for the User Flow label (since none was given).
4. Stops at the confirmation gate without creating an issue.

If any step deviates, capture the specific gap and fix the underlying SKILL.md or reference; re-run `npm run eval:creating-product-issues` to confirm the fix did not regress the eval.

---

## Completion Checklist

When all 12 tasks are done, the branch `feat/creating-product-issues-skill` should contain:

- A self-contained skill at `skills/creating-product-issues/` (SKILL.md + 2 new references).
- Cross-linked references to `creating-linear-issue` for `bug-intake.md`, `issue-breakdown.md`, and `issue-drafting.md`.
- An eval package at `tests/evals/packages/creating-product-issues/` with 1 smoke + 5 scenarios, all passing.
- A slash-command wrapper at `commands/creating-product-issues.md`.
- A user-guide page at `docs/user-guide/creating-product-issues.md`.
- One-line entries in the repo-root `package.json`, `tests/evals/package.json`, and `AGENTS.md`.

Once the verification suite passes cleanly, raise a PR from `feat/creating-product-issues-skill` against `main` using the `raising-linear-pr` skill (or the appropriate variant if no Linear ticket has been filed).
