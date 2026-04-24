# Linear Operations

Execute Linear operations directly by default using MCP tools. Use sub-agents only when parallel research is required.

## Workflow Contract

- Use the available Linear MCP tools needed for the current workflow.
- Prefer direct MCP operations over sub-agents unless parallel research is required.
- If a required tool fails after one retry, stop and report the exact failing step.

## User Flow Child Labels

- Applies only to issues in the `Studio`, `Roadmap`, and `Utilities` teams. Other teams do not enforce this rule.
- Resolve the child-label list at runtime via the available Linear MCP label-listing tool. Two gotchas matter:
  - **Query at the workspace level, not the team level.** `User Flow` labels are defined at the workspace scope; a team-scoped label query will return no match. Do not pass a team filter on the initial list call.
  - **Filter by parent label, not by label name.** A `name: "User Flow"` filter returns the parent label itself, not its children. List labels without a name filter, then keep only those whose parent label's name is `User Flow`.
- Use each candidate's name and description to match against the issue title and scope. Propose exactly one child label.
- Do not hard-code the `User Flow` child-label list inside this skill — it can grow or be renamed in Linear.
- If no child label clearly fits, ask the user to pick one from the current list or explicitly approve creating without a `User Flow` label. Do not silently omit it.
