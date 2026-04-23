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
│   ├── agent-browser/
│   ├── closing-linear-issue/
│   ├── create-feature-request/
│   ├── creating-linear-issue/
│   ├── explaining-code/
│   ├── implementing-linear-issue/
│   ├── maintain-github-repos/
│   ├── playwright/
│   ├── raising-linear-pr/
│   ├── shadcn-ui/
│   └── writing-tests/
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
- Keep `.claude-plugin/plugin.json` and `.codex-plugin/plugin.json` on the same plugin name and version.
- This plugin source repo is licensed under Elastic License 2.0 (`ELv2`). The bundled Playwright license remains under its upstream Apache 2.0 license.

### Plugin Metadata Validation

```bash
npm run validate:plugin-manifests
npm run check:plugin-version
npm run test:validators
```

Use those commands after changing plugin metadata, skills, docs that affect
plugin packaging, or the repository license. `check:plugin-version` compares the
shared Claude/Codex plugin version against `origin/main`.

Codex CLI marketplace registration is performed against a marketplace repo/root,
not directly against this plugin source repo.

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
npm run eval:maintain-github-repos
npm run eval:codex-compatibility
```

Metadata-only changes do not require running the full promptfoo eval suite, but
the deterministic compatibility checks remain available through the commands
above when skill content or Codex compatibility changes.

## License

This repository is licensed under Elastic License 2.0. See [LICENSE](./LICENSE).

Third-party bundled content keeps its own license. In particular,
[`skills/playwright/LICENSE.txt`](./skills/playwright/LICENSE.txt) remains the
upstream Microsoft Playwright Apache 2.0 license.

## Current Skills

| Skill | Purpose |
| --- | --- |
| [`adversarial-review`](./skills/adversarial-review) | Adversarial code review using the opposite model (Claude spawns Codex, Codex spawns Claude) to challenge large diffs from distinct critical lenses. |
| [`agent-browser`](./skills/agent-browser) | Browser automation CLI for AI agents: navigate, fill forms, click, screenshot, scrape, or test web apps programmatically. |
| [`closing-linear-issue`](./skills/closing-linear-issue) | Merge, close, and clean up branches and worktrees after a Linear issue's PR has been reviewed. |
| [`create-feature-request`](./skills/create-feature-request) | Log a feature request into the Roadmap (RO) team in Linear from free-form natural language. |
| [`creating-linear-issue`](./skills/creating-linear-issue) | Draft or refine a Linear issue — preferred over the generic Linear skill for new-issue creation and decomposition. |
| [`explaining-code`](./skills/explaining-code) | Explain code with analogies, ASCII diagrams, and step-by-step walkthroughs with gotchas. |
| [`implementing-linear-issue`](./skills/implementing-linear-issue) | Implement an approved Linear issue: branch/worktree setup, plan approval, checkpoint commits, quality gates — stops before the PR phase. |
| [`maintain-github-repos`](./skills/maintain-github-repos) | Hygiene for `accelerate-data` GitHub org: decide which stale `dev*`/`scratch*` repos to archive or delete. |
| [`playwright`](./skills/playwright) | Drive a real browser from the terminal via `playwright-cli` for navigation, form-filling, snapshots, screenshots, and UI-flow debugging. |
| [`raising-linear-pr`](./skills/raising-linear-pr) | PR-phase workflow after implementation: verification rerun, AC completion check, push, PR creation, and `In Review` transition. |
| [`shadcn-ui`](./skills/shadcn-ui) | shadcn/ui + Tailwind CSS 4 component work: adding primitives, customizing variants, building layouts. |
| [`writing-tests`](./skills/writing-tests) | Write, update, audit, or review unit and integration tests using Vladimir Khorikov's standards. |
