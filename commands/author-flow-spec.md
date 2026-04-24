---
description: Author a behavior-focused user-flow spec from a canonical ID. Thin wrapper around the authoring-flow-spec skill.
---

# /author-flow-spec

Invoke the `authoring-flow-spec` skill to author (or update) a user-flow
specification.

## Usage

- `/author-flow-spec <canonical-id>` — author the flow with the given canonical
  ID (e.g., `/author-flow-spec intent-user-data-mart-build`).
- `/author-flow-spec` — invoke the skill with no ID; the skill will ask.

## What this does

Delegates to `Skill("authoring-flow-spec")`. The skill:

1. Confirms `gws` is logged in and you are inside one of the four target repos
   (`studio`, `skill-builder`, `domain-cicd`, `migration-utility`).
2. Looks up the canonical ID in the User-Flows-Details Sheet to resolve
   target `repo`, `category`, `title`, `persona`.
3. Verifies the repo you are in matches the Sheet's `repo` column.
4. Drafts the spec against the bundled flow-spec template.
5. Hands off to `superpowers:brainstorming` to pressure-test the draft.
6. Writes the result to `<repo>/docs/functional/<canonical-id>/README.md`
   (or `NN-<child-slug>.md` if the ID is a child composite).
7. Offers to commit — you decide when.

For the full behavior contract, see
[`skills/authoring-flow-spec/SKILL.md`](../skills/authoring-flow-spec/SKILL.md).
