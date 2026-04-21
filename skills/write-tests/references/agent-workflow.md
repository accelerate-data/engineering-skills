# Agent Workflow Rule — Separate Sessions

**The agent that builds the feature must NOT write its tests.**

## Why

AI agents self-attest. The agent that wrote the code knows what the code does and writes tests that confirm it — including bugs. It cannot see its own mistakes because it shares the same context.

Knowing the code better than anyone is precisely why the same agent cannot write the tests. Familiarity is the liability, not the benefit: you will write tests that confirm what the code does, including its bugs, because you cannot unsee your own implementation.

## How to enforce

- Feature work and test work run in **separate sessions** with separate context
- The test session receives the **requirement** (what the code should do), not the implementation
- The test session reads the code fresh, like an independent reviewer

This aligns with the **Planner-Generator-Evaluator pattern**: the evaluator must not share context with the generator.

## Session boundary

A session = one conversation window. Invoking the write-tests skill in the same conversation that wrote the code does NOT create a separate session — you still share the same context and the same blind spots.

## Exception — TDD mode

If no code exists yet (tests written FIRST, then implementation), the rule does not fire. You can't self-attest to code that doesn't exist.

## Even if the user insists

"It'll be faster", "we're in a hurry", "I know the code better than anyone" — the rule does not change. Efficiency in the wrong session produces tests that pass against bugs. Refuse, explain the handoff, and stop.

## In practice

When `implementing-linear-issue` finishes, do not continue into test-writing in the same session. Hand off. A fresh session invokes `write-tests` with the requirement and the finished code — never the implementation session writing its own tests.
