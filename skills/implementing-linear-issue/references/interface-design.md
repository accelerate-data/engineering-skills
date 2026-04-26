# Interface Design Reference

Use this reference when a Linear issue needs interface design before coding. Here, "interface" can mean a developer-facing API/module boundary or a user-facing UI interaction contract.

This note is inspired by Matt Pocock's `design-an-interface` skill:
https://github.com/mattpocock/skills/blob/main/design-an-interface/SKILL.md

## When It Applies

| Signal | Meaning |
|---|---|
| Issue asks for API, module boundary, component contract, or user interaction with no approved shape | Interface design needed |
| Callers, users, operations, hidden details, or constraints are unclear | Interface contract is not ready |
| User says "design the interface first", "no mockup yet", "show me options for the API", or "don't lock in the first shape" | Hand off before implementation |

## Design Questions

| Question | Examples |
|---|---|
| What problem should this interface solve? | User goal, caller need, operational task |
| Who calls or uses it? | Modules, services, tests, admins, end users |
| What operations and states are essential? | Commands, data states, loading, errors, empty states |
| What should stay hidden? | Implementation details, persistence, external APIs, styling internals |
| What constraints already exist? | Compatibility, performance, accessibility, design system, security, repo patterns |

## Routing

| Condition | Handoff |
|---|---|
| Durable interface decision or no approved UI/API/component contract | `authoring-design-spec` |
| User asks to think, review options, or brainstorm before committing | `superpowers:brainstorming` |
| Design direction exists and implementation can proceed | `superpowers:writing-plans` |
| End-user UI, CLI, or documented workflow changes | `authoring-user-guide` |
