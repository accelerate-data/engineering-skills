---
description: File a product issue into Linear's Studio or Utilities team.
---

# /creating-product-issues

Invoke `creating-product-issues` to file a product issue into Linear's Studio or Utilities team.

## Usage

- `/creating-product-issues <request>` — file an issue for the described request.
- `/creating-product-issues` — invoke with no request; the skill will ask.

## What this does

Delegates to `Skill("creating-product-issues")`. The skill:

1. Classifies the request as feature, bug, or spike.
2. Searches the codebase and existing Linear issues.
3. Resolves the team (Studio or Utilities only), the User Flow child label, and the owner from the static team-to-owner map.
4. Reads the matching functional spec and related design docs.
5. Confirms team, owner, and User Flow label with the user.
6. Shows the issue draft and creates the Linear issue only after approval.

The filed issue has no `project`, `milestone`, or `cycle` set.
