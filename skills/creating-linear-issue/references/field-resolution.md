# Field Resolution

Use this reference after codebase and duplicate-issue search, before issue drafting.

## Issue Kind

| Kind | Use when | Issue must capture |
|---|---|---|
| `feature` | Net-new functionality or capability changes | User outcome, scope, acceptance criteria, rollout constraints |
| `bug` | Regression, defect, broken behavior, or incorrect output | Symptom, impact, expected vs actual behavior, repro, consistency, severity, fix acceptance criteria |
| `spike` | Research, design, investigation, or documentation-driven discovery | Question to answer, research boundary, deliverable, exit criteria |

## Critical Fields

| Field | Resolution rule | If unresolved |
|---|---|---|
| `project` | Check `AGENTS.md` first. If it gives one clear project, use that provisional choice; otherwise inspect Linear projects and repo context. | Ask the user. |
| `milestone` | Load milestones for the resolved project. Ignore past milestones. Prefer one clear future milestone. | If multiple viable future milestones remain, ask the user to choose. |
| `assignee` | Default to the issue creator unless the request or repo context clearly points elsewhere. | Ask only when context conflicts. |
| `cycle` | Default to the current cycle unless the request clearly points elsewhere. | Ask only when context conflicts. |
| `User Flow` child label | Required only for `Studio`, `Roadmap`, and `Utilities`. | Ask for a child label when required and no clear match exists. |

Defaults are resolved values. Include defaulted `assignee` and `cycle` in the confirmation question instead of silently applying them.

## User Flow Rule

| Case | Rule |
|---|---|
| Team is not `Studio`, `Roadmap`, or `Utilities` | Skip User Flow resolution entirely. Do not read child labels, recommend alternatives, or include a User Flow field in confirmation. |
| One clear selected-team match | Propose exactly one child label by matching title and scope against candidate names and descriptions. |
| Multiple close selected-team matches | Recommend one label and list close alternatives in the same confirmation question. |
| No selected-team match | Ask the user to pick from current child labels before drafting. |
| Functional spec missing | Stop before drafting and ask the user to author the functional spec first. |

Read `linear-operations.md` for lookup mechanics.

## Confirmation

Ask at most one user question at a time.

The field-confirmation question includes:

- `project`
- `milestone`, or viable future milestone choices
- `assignee`
- `cycle`
- selected-team User Flow label and functional spec path, when applicable

If the project was missing from `AGENTS.md` and the user supplies it, ask after that answer whether they want the durable project mapping added to `AGENTS.md`.
