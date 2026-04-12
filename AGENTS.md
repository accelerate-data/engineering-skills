# Engineering Skills Plugin

Shared plugin repository for engineering-team skills used by Claude Code and Codex.

**Maintenance rule:** This file contains durable repository guidance, not volatile inventory. If a fact is easy to rediscover from the tree or will go stale when files move, keep it in `repo-map.json` instead.

## Instruction Hierarchy

Use this precedence when maintaining agent guidance:

1. `AGENTS.md` - canonical, cross-agent source of truth
2. Skill-local references under `skills/<skill>/references/`
3. `CLAUDE.md` - Claude-specific adapter and routing

For Codex, `AGENTS.md` is also the repo-local instruction surface. Do not add a separate Codex adapter file unless Codex introduces a real supported convention for one.

Adapter files must stay lightweight and should not duplicate canonical policy unless they add agent-specific behavior.

## Repository Purpose

This repository is a single plugin-source repo, not a marketplace repo.

- Root manifests: `.claude-plugin/plugin.json` and `.codex-plugin/plugin.json`
- Canonical skill content: `skills/`
- Promptfoo eval harness for skills in this repo: `tests/evals/`

## Agent Startup Context

Read `repo-map.json` before any non-trivial task. It is the primary index for structure, commands, and the current eval layout.

## Repository Structure

Read `repo-map.json` for the current file layout, key modules, and commands instead of rediscovering the tree from scratch.

## Maintenance Rules

| Artifact | Update when |
|---|---|
| `AGENTS.md` | A fact is durable, cross-cutting, and not obvious from the code tree |
| `repo-map.json` | Any structural entry becomes stale: manifests, skills, eval harness layout, commands, or key docs |
| `CLAUDE.md` | Claude-specific routing or adapter behavior changes |

Update stale guidance in the same change that introduces the structural change.

## Testing

### When to run evals

Run promptfoo evals when:

1. A skill workflow changes
2. A skill prompt contract changes
3. A skill reference changes behavior materially
4. A regression is fixed in a skill that already has coverage

Pure packaging or metadata changes do not require running all evals.

### Eval discipline

- Keep eval ownership with the repository that owns the skill.
- Do not let cross-repo references leak into skills or eval prompts.
- Prefer package-local assertions and prompts over shared product-specific helpers.

## Skill Ownership

This repo owns only the skills that physically live under `skills/`.

- Do not add `superpowers` here. That stays in its own repository.
- Do not add references that require files outside this plugin repo.
- If a skill needs support material, place it under that skill directory.

## Local Development Pattern

For direct local use without a marketplace, symlink individual skill directories from `skills/<skill-name>` into:

- `~/.claude/skills/<skill-name>`
- `~/.codex/skills/<skill-name>`

Keep the symlink name identical to the skill directory name.

## Git Hooks

This repo provides a repo-managed pre-commit hook in `.githooks/pre-commit`.

- Enable it with `git config core.hooksPath .githooks`
- Keep it focused on durable repo policy, not machine-local tooling

## Skills

Use these repo-local skills when requests match:

- `skills/creating-linear-issue/SKILL.md` - create or refine a Linear issue
- `skills/implementing-linear-issue/SKILL.md` - implement a Linear issue
- `skills/raising-linear-pr/SKILL.md` - run the PR phase for a completed issue
- `skills/closing-linear-issue/SKILL.md` - merge, close, and clean up after review
- `skills/adversarial-review/SKILL.md` - run adversarial code review
- `skills/shadcn-ui/SKILL.md` - shadcn/ui component work
- `skills/explaining-code/SKILL.md` - explain code with diagrams and teaching-style breakdowns
- `skills/playwright/SKILL.md` - browser automation workflows

## Conventions

- Keep all skill directories under `skills/`.
- Keep eval prompts and assertions self-contained under `tests/evals/`.
- Avoid adding repo-specific styling, product assumptions, or external path dependencies to shared skills.
