# Engineering Skills Plugin

Shared engineering-team skills for Claude Code and Codex.

This repository is a single plugin source repo, not a marketplace repo.

- Claude marketplaces should point to this repo as the plugin source.
- Codex marketplaces should point to this repo as the plugin source.
- The canonical skill content lives in [`skills/`](./skills).

## Layout

```text
.
├── .claude-plugin/plugin.json
├── .codex-plugin/plugin.json
├── skills/
│   ├── adversarial-review/
│   ├── closing-linear-issue/
│   ├── creating-linear-issue/
│   ├── explaining-code/
│   ├── implementing-linear-issue/
│   ├── playwright/
│   ├── raising-linear-pr/
│   └── shadcn-ui/
└── README.md
```

## Use In Claude

Install this repo through a Claude plugin marketplace that references this repository as a plugin source.

This repo exposes the Claude plugin manifest at [`.claude-plugin/plugin.json`](./.claude-plugin/plugin.json).

For local development without a marketplace, follow the same pattern already used in `~/.claude/skills`: symlink each skill directory directly into `~/.claude/skills`.

Example:

```bash
mkdir -p ~/.claude/skills

ln -s /absolute/path/to/engineering-skills/skills/adversarial-review \
  ~/.claude/skills/adversarial-review

ln -s /absolute/path/to/engineering-skills/skills/playwright \
  ~/.claude/skills/playwright
```

Repeat that pattern for any other skill in this repo. The symlink name should match the skill directory name.

## Use In Codex

Install this repo through a Codex plugin marketplace that references this repository as a plugin source.

This repo exposes the Codex plugin manifest at [`.codex-plugin/plugin.json`](./.codex-plugin/plugin.json).

Repo-local Codex guidance lives in [`AGENTS.md`](./AGENTS.md). Unlike Claude, this repo does not use a separate Codex adapter file.

For local development without a marketplace, follow the same pattern already used in `~/.codex/skills`: symlink each skill directory directly into `~/.codex/skills`.

Example:

```bash
mkdir -p ~/.codex/skills

ln -s /absolute/path/to/engineering-skills/skills/adversarial-review \
  ~/.codex/skills/adversarial-review

ln -s /absolute/path/to/engineering-skills/skills/playwright \
  ~/.codex/skills/playwright
```

Repeat that pattern for any other skill in this repo. The symlink name should match the skill directory name.

## Development Notes

- Keep all skill directories under `skills/`.
- Do not add `superpowers` here. That stays in its own repository and is installed separately.
- Keep skill assets, scripts, references, and agents inside the owning skill directory.
- Avoid cross-repo relative paths. A plugin install is expected to be self-contained.

### Git Hooks

This repo includes a repo-managed pre-commit hook under [`.githooks/pre-commit`](./.githooks/pre-commit) to block accidental commits of Anthropic API keys.

Enable it locally:

```bash
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit
```

## Eval Harness

Promptfoo evals for skills in this repository live under [`tests/evals/`](./tests/evals).

Run them from the harness directory:

```bash
cd tests/evals
npm install
npm run eval
```

Individual suites:

```bash
cd tests/evals
npm run eval:creating-linear-issue
npm run eval:implementing-linear-issue
npm run eval:raising-linear-pr
npm run eval:closing-linear-issue
```

## Current Skills

- `adversarial-review`
- `closing-linear-issue`
- `creating-linear-issue`
- `explaining-code`
- `implementing-linear-issue`
- `playwright`
- `raising-linear-pr`
- `shadcn-ui`
