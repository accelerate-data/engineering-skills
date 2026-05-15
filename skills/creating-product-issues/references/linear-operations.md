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
