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
| Team scope | Applies only when the resolved Linear team is `Studio`, `Roadmap`, or `Utilities`. |
| Runtime lookup | Resolve child labels at runtime with the available Linear MCP label-listing tool. |
| Query scope | Query at workspace scope, not team scope. `User Flow` labels are workspace labels; team-scoped queries can miss them. |
| Parent filter | Do not query with `name: "User Flow"`; that returns the parent label. List labels without a name filter, then keep labels whose parent label name is `User Flow`. |
| Matching inputs | Match each candidate's name and description against the issue title and scope. |
| Recommendation | Propose exactly one child label when one clear match exists. |
| Close alternatives | If multiple candidates are close, list alternatives beside the recommendation in the field-confirmation question. |
| No clear match | Ask the user to pick from the current child-label list before drafting. Do not create a selected-team issue without a child label. |
| Hard-coding | Never hard-code child-label names; they can grow or be renamed in Linear. |
