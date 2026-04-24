# Linear Operations

Execute Linear operations directly by default using MCP tools. Use sub-agents only when parallel research is required.

## Workflow Contract

- Use the available Linear MCP tools needed for the current workflow.
- Prefer direct MCP operations over sub-agents unless parallel research is required.
- If a required tool fails after one retry, stop and report the exact failing step.

## User Flow Child Labels

- Applies only to issues in the `Studio`, `Roadmap`, and `Utilities` teams. Other teams do not enforce this rule.
- Resolve the label list at runtime via the available Linear MCP label listing tool scoped to the issue's team. Filter the results to labels whose parent is `User Flow`.
- Use each candidate's name and description to match against the issue title and scope. Propose exactly one child label.
- Do not hard-code the `User Flow` child-label list inside this skill — it can grow or be renamed in Linear.
- If no child label clearly fits, ask the user to pick one from the current list or explicitly approve creating without a `User Flow` label. Do not silently omit it.
