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
├── commands/
│   └── author-flow-spec.md
├── skills/
│   ├── adversarial-review/
│   ├── agent-browser/
│   ├── authoring-flow-spec/
│   ├── closing-linear-issue/
│   ├── code-simplifier/
│   ├── create-feature-request/
│   ├── creating-linear-issue/
│   ├── e2e-adding-scenario/
│   ├── e2e-authoring-feature-file/
│   ├── e2e-extending-step-vocabulary/
│   ├── e2e-regenerating-from-guide/
│   ├── explaining-code/
│   ├── implementing-linear-issue/
│   ├── maintain-github-repos/
│   ├── raising-linear-pr/
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

ln -s /absolute/path/to/engineering-skills/skills/code-simplifier \
  ~/.claude/skills/code-simplifier
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

ln -s /absolute/path/to/engineering-skills/skills/code-simplifier \
  ~/.codex/skills/code-simplifier
```

Repeat that pattern for any other skill in this repo. The symlink name should match the skill directory name.

## Development Notes

- Keep all skill directories under `skills/`.
- Do not add `superpowers` here. That stays in its own repository and is installed separately.
- Keep skill assets, scripts, references, and agents inside the owning skill directory.
- Avoid cross-repo relative paths. A plugin install is expected to be self-contained.
- Keep `.claude-plugin/plugin.json` and `.codex-plugin/plugin.json` on the same plugin name and version.
- This plugin source repo is licensed under Elastic License 2.0 (`ELv2`).

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

Validated OpenCode POC setup for `AD-19`:

```bash
curl -fsSL https://opencode.ai/install | bash
opencode auth login
cd tests/evals
npm install
```

The currently validated provider path is:

- `promptfoo@0.121.7`
- local Promptfoo provider: `tests/evals/scripts/opencode-cli-provider.js`
- OpenCode CLI via `opencode run`
- `model: gpt-5-nano`

Run them from the harness directory:

```bash
cd tests/evals
npm install
npm run eval
```

Validated targeted POC command:

```bash
cd tests/evals
npm run eval:creating-linear-issue
```

Individual suites:

```bash
cd tests/evals
npm run eval:creating-linear-issue
npm run eval:creating-linear-issue-routing
npm run eval:implementing-linear-issue
npm run eval:raising-linear-pr
npm run eval:closing-linear-issue
npm run eval:maintain-github-repos
npm run eval:create-feature-request
npm run eval:writing-tests
npm run eval:coverage
npm run eval:e2e-adding-scenario
npm run eval:e2e-authoring-feature-file
npm run eval:e2e-extending-step-vocabulary
npm run eval:e2e-regenerating-from-guide
npm run eval:codex-compatibility
```

Metadata-only changes do not require running the full promptfoo eval suite, but
the deterministic compatibility checks remain available through the commands
above when skill content or Codex compatibility changes.

## License

This repository is licensed under Elastic License 2.0. See [LICENSE](./LICENSE).

## Current Skills

| Skill | Purpose |
| --- | --- |
| [`adversarial-review`](./skills/adversarial-review) | Adversarial code review using the opposite model (Claude spawns Codex, Codex spawns Claude) to challenge large diffs from distinct critical lenses. |
| [`agent-browser`](./skills/agent-browser) | Browser automation CLI for AI agents: navigate, fill forms, click, screenshot, scrape, or test web apps programmatically. |
| [`authoring-flow-spec`](./skills/authoring-flow-spec) | Author a behavior-focused Vibedata user-flow spec from a canonical ID in the User-Flows-Details Sheet; writes to the target repo's `docs/functional/<id>/README.md`. |
| [`closing-linear-issue`](./skills/closing-linear-issue) | Merge, close, and clean up branches and worktrees after a Linear issue's PR has been reviewed. |
| [`code-simplifier`](./skills/code-simplifier) | Simplify recently modified code by removing needless complexity while preserving behavior and project standards. |
| [`create-feature-request`](./skills/create-feature-request) | Log a feature request into the Roadmap (RO) team in Linear from free-form natural language. |
| [`creating-linear-issue`](./skills/creating-linear-issue) | Draft or refine a Linear issue — preferred over the generic Linear skill for new-issue creation and decomposition. |
| [`e2e-adding-scenario`](./skills/e2e-adding-scenario) | Append BDD scenarios to an existing `.feature` file in a Playwright+Claude e2e harness. Set `E2E_HARNESS_ROOT` when running from outside the harness. |
| [`e2e-authoring-feature-file`](./skills/e2e-authoring-feature-file) | Author a new `.feature` file from scratch in a Playwright+Claude e2e harness. Set `E2E_HARNESS_ROOT` when running from outside the harness. |
| [`e2e-extending-step-vocabulary`](./skills/e2e-extending-step-vocabulary) | Add a missing step pattern to `steps/*.md` in a Playwright+Claude e2e harness. Set `E2E_HARNESS_ROOT` when running from outside the harness. |
| [`e2e-regenerating-from-guide`](./skills/e2e-regenerating-from-guide) | Regenerate a `.feature` file from its user-guide source page via `./generate-features.sh`. Set `E2E_HARNESS_ROOT` when running from outside the harness. |
| [`explaining-code`](./skills/explaining-code) | Explain code with analogies, ASCII diagrams, and step-by-step walkthroughs with gotchas. |
| [`implementing-linear-issue`](./skills/implementing-linear-issue) | Implement an approved Linear issue: branch/worktree setup, plan approval, checkpoint commits, quality gates — stops before the PR phase. |
| [`maintain-github-repos`](./skills/maintain-github-repos) | Hygiene for `accelerate-data` GitHub org: decide which stale `dev*`/`scratch*` repos to archive or delete. |
| [`raising-linear-pr`](./skills/raising-linear-pr) | PR-phase workflow after implementation: verification rerun, AC completion check, push, PR creation, and `In Review` transition. |
| [`writing-tests`](./skills/writing-tests) | Write, update, audit, or review unit and integration tests using Vladimir Khorikov's standards. |
