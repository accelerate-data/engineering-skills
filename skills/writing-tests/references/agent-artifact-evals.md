# Agent Artifact Evals

Use this reference when the artifact under test is a skill, slash command, or agent prompt.

## Ownership

`superpowers:writing-skills` owns authoring quality: progressive discovery, reference placement, repetition, over-explaining, search triggers, and skill TDD discipline.

`writing-tests` owns eval quality: what behaviours must be covered, which pressure scenarios matter, and what assertions prove compliance.

## Eval Targets

| Artifact | Behaviours to test |
|---|---|
| Skill | trigger fit, gates, reference loading, required handoffs, fallback behaviour |
| Slash command | argument parsing, missing inputs, routing, permission boundaries, output contract |
| Agent prompt | task selection, tool-use policy, stop conditions, delegation boundaries, final-report contract |

## Scenario Set

Cover at least:

1. Happy path: expected trigger and normal inputs.
2. Ambiguous input: asks the minimum clarifying question or stops.
3. Pressure: user asks to skip required process.
4. Boundary: unsupported or unsafe request uses the documented fallback.
5. Regression: a past failure or rationalization stays closed.

Prefer structured contract assertions over snapshot-only grading. The eval should fail when the artifact skips a gate, over-applies itself, loads unnecessary references, or claims success without verification.
