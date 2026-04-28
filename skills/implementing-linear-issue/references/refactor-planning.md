# Refactor Planning Reference

Use this reference when a Linear issue requires a major refactor, especially when the user wants safer incremental change rather than a direct feature patch.

This note is inspired by Matt Pocock's `request-refactor-plan` skill:
https://github.com/mattpocock/skills/blob/main/request-refactor-plan/SKILL.md

## When It Applies

| Signal | Meaning |
|---|---|
| Issue asks to simplify, untangle, modularize, split, consolidate, or replace existing code without behavior change | Refactor planning applies |
| Discovery finds broad call-site impact, migration risk, or unclear intermediate states | Ordered checkpoints needed |
| User says "refactor this first", "make this less tangled", "clean up the old importer", or "break this into safe steps" | Plan refactor before coding |

## Planning Rules

| Planning area | Requirement |
|---|---|
| Current behavior | Verify from code and tests before structural changes |
| Behavior boundary | Define what must not change from the user's perspective |
| Checkpoints | Keep each checkpoint runnable and reviewable |
| Tests | Decide regression coverage before implementation starts |
| Scope control | Record out-of-scope cleanup explicitly |

## Routing

| Condition | Handoff |
|---|---|
| Refactor is ready to plan | `superpowers:writing-plans` with module boundaries and ordered checkpoints |
| Architecture, boundaries, data ownership, persistence, security, permissions, or migrations change | `authoring-design-spec` before implementation plan |
| Implementation starts | `superpowers:test-driven-development` with characterization or regression tests |
