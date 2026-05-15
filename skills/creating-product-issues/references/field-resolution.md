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
