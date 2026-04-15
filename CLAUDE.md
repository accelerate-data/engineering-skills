@AGENTS.md

## Adapter Role

`AGENTS.md` is canonical for repository-wide guidance. This file is a Claude-specific adapter and should stay lightweight.

## Custom Skills

### /create-linear-issue

When the user runs `/create-linear-issue` or asks to create, log, file, or decompose a Linear issue,
read and follow the skill at `skills/creating-linear-issue/SKILL.md`.

### /implement-linear-issue

When the user runs `/implement-linear-issue`, mentions a Linear issue identifier, or asks to implement, fix, or work on a Linear issue,
read and follow the skill at `skills/implementing-linear-issue/SKILL.md`.

### /raise-linear-pr

When the user asks to raise the PR, open the PR, finish the PR phase, or move an implemented issue into review,
read and follow the skill at `skills/raising-linear-pr/SKILL.md`.

### /close-linear-issue

When the user runs `/close-linear-issue`, or asks to close, complete, merge, or ship a Linear issue,
read and follow the skill at `skills/closing-linear-issue/SKILL.md`.

### /create-feature-request

When the user runs `/create-feature-request` or asks to create, log, or file a feature request in Linear,
read and follow the skill at `skills/create-feature-request/SKILL.md`.
