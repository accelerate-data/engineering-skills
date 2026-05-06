# Context Gathering

Build the review context in this order:

1. Read the PR body.
2. Read the code changes.
3. Look for PR-body issue references first. The usual pattern is `Fixes VD-1234`, `Fixes VU-1234`, `Fixes AD-1234`, or a similar 2–3 letter prefix plus number. Treat that issue key as the default Linear issue identifier and resolve it through MCP search.
4. Read related docs and specs.

## PR Claim

Source `PR Claim` only from:

- the PR body
- the code changes

Do not redefine the PR claim from Linear alone.

## Required Scope

Source `Required Scope` from:

- the linked Linear issue
- Linear acceptance criteria
- linked design docs
- linked implementation plans
- attached or linked supporting documents from the Linear issue
- related functional specs discovered under `docs/functional/`

Read `docs/functional/` and actively search for related items, not only directly linked specs.

## Implemented Scope

Source `Implemented Scope` from:

- changed files
- tests added or changed
- docs changed in the PR

If related-spec mapping is uncertain, ask the user to confirm the ambiguous mapping once, then continue based on the feedback.
