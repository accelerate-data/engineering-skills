# OpenCode Run Promptfoo Provider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Promptfoo eval harness dependency on `opencode serve` with a custom Promptfoo provider that invokes `opencode run` directly.

**Architecture:** Keep `tests/evals/scripts/promptfoo.sh` as the single eval entrypoint, but remove all OpenCode server lifecycle management from it. Each eval package will use a local JavaScript provider file that shells out to `opencode run --model opencode/qwen3.6-plus --agent build <prompt>` and returns stdout to Promptfoo for the existing JavaScript assertions.

**Tech Stack:** Promptfoo `0.121.7`, OpenCode CLI `1.14.x`, Node.js CommonJS provider modules, shell wrapper scripts, repository-local Promptfoo artifact directories.

---

## Context

`AD-23` is blocked at PR time because `npm run eval:maintain-github-repos` must run, but the current harness starts `opencode serve` on `127.0.0.1:4096`. In this local environment `opencode serve` fails while listening, while the migration-utility OpenCode cutover branch avoids that failure class by using a custom Promptfoo provider that calls `opencode run` directly.

This plan adapts that approach for `engineering-skills` with minimal repo-local changes. It intentionally does not introduce eval tiers or resolved temp configs, because every eval package in this repo already declares its own provider block and the immediate blocker is the `opencode:sdk` server path.

## File Structure

- Create `tests/evals/scripts/opencode-cli-provider.js`: Promptfoo custom provider that runs the OpenCode CLI once per Promptfoo test case.
- Create `tests/evals/scripts/opencode-cli-provider.test.js`: unit tests for provider command construction, output handling, error handling, and abort handling.
- Modify `tests/evals/scripts/promptfoo.sh`: remove OpenCode server startup, keep repo-local Promptfoo and OpenCode state directories.
- Modify `tests/evals/package.json`: add the provider test to a script and keep existing eval scripts unchanged.
- Modify `tests/evals/packages/**/*.yaml`: replace inline `opencode:sdk` providers with the custom provider file while preserving `model`, `working_dir`, `max_turns`, and `tools` config values.
- Modify or add a harness contract test under `tests/evals/scripts/`: assert no eval package uses `opencode:sdk`, `baseUrl`, or server management.
- Modify `repo-map.json`: update eval harness notes if they describe server-managed OpenCode execution.

## Task 1: Add the OpenCode CLI Provider

**Files:**

- Create: `tests/evals/scripts/opencode-cli-provider.js`
- Create: `tests/evals/scripts/opencode-cli-provider.test.js`

- [ ] **Step 1: Write provider tests first**

Create `tests/evals/scripts/opencode-cli-provider.test.js`:

```js
const assert = require('node:assert/strict');
const test = require('node:test');
const { EventEmitter } = require('node:events');

const OpenCodeCliProvider = require('./opencode-cli-provider');

function createSpawnResult({ code = 0, stdout = '', stderr = '' } = {}) {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.killCalls = [];
  child.kill = (signal) => {
    child.killCalls.push(signal);
  };

  process.nextTick(() => {
    if (stdout) {
      child.stdout.emit('data', Buffer.from(stdout));
    }
    if (stderr) {
      child.stderr.emit('data', Buffer.from(stderr));
    }
    child.emit('close', code);
  });

  return child;
}

test('callApi invokes opencode run with configured model and prompt', async () => {
  const calls = [];
  const provider = new OpenCodeCliProvider({
    id: 'opencode:cli',
    config: {
      provider_id: 'opencode',
      model: 'qwen3.6-plus',
      working_dir: '../..',
      agent: 'build',
    },
    spawnImpl: (command, args, options) => {
      calls.push({ command, args, options });
      return createSpawnResult({ stdout: 'expected output\n' });
    },
  });

  const result = await provider.callApi('Read the skill and summarize it.');

  assert.deepEqual(result, { output: 'expected output' });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].command, 'opencode');
  assert.deepEqual(calls[0].args, [
    'run',
    '--model',
    'opencode/qwen3.6-plus',
    '--agent',
    'build',
    'Read the skill and summarize it.',
  ]);
  assert.equal(calls[0].options.stdio[0], 'ignore');
  assert.match(calls[0].options.cwd, /engineering-skills$/);
  assert.match(calls[0].options.env.XDG_STATE_HOME, /tests\/evals\/\.promptfoo\/opencode-runtime\/state$/);
});

test('callApi returns stderr when opencode exits non-zero', async () => {
  const provider = new OpenCodeCliProvider({
    config: {
      provider_id: 'opencode',
      model: 'qwen3.6-plus',
    },
    spawnImpl: () => createSpawnResult({ code: 1, stderr: 'model unavailable' }),
  });

  const result = await provider.callApi('prompt');

  assert.deepEqual(result, { error: 'model unavailable' });
});

test('callApi validates required provider_id and model config', async () => {
  const provider = new OpenCodeCliProvider({
    config: {
      provider_id: 'opencode',
    },
    spawnImpl: () => createSpawnResult({ stdout: 'should not run' }),
  });

  const result = await provider.callApi('prompt');

  assert.deepEqual(result, { error: 'OpenCode CLI provider requires provider_id and model' });
});

test('callApi terminates opencode when Promptfoo aborts the request', async () => {
  let spawnedChild;
  const controller = new AbortController();
  const provider = new OpenCodeCliProvider({
    config: {
      provider_id: 'opencode',
      model: 'qwen3.6-plus',
    },
    spawnImpl: () => {
      spawnedChild = new EventEmitter();
      spawnedChild.stdout = new EventEmitter();
      spawnedChild.stderr = new EventEmitter();
      spawnedChild.killCalls = [];
      spawnedChild.kill = (signal) => spawnedChild.killCalls.push(signal);
      return spawnedChild;
    },
  });

  const pending = provider.callApi('prompt', {}, { abortSignal: controller.signal });
  controller.abort();

  const result = await pending;

  assert.deepEqual(result, { error: 'OpenCode CLI call aborted' });
  assert.deepEqual(spawnedChild.killCalls, ['SIGTERM']);
});
```

- [ ] **Step 2: Run the provider test and verify it fails**

Run:

```bash
npm --prefix tests/evals exec -- node --test scripts/opencode-cli-provider.test.js
```

Expected: FAIL because `tests/evals/scripts/opencode-cli-provider.js` does not exist yet.

- [ ] **Step 3: Implement the provider**

Create `tests/evals/scripts/opencode-cli-provider.js`:

```js
const { spawn } = require('node:child_process');
const path = require('node:path');

const EVAL_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(EVAL_ROOT, '..', '..');
const DEFAULT_STATE_HOME = path.join(EVAL_ROOT, '.promptfoo', 'opencode-runtime', 'state');

class OpenCodeCliProvider {
  constructor(options = {}) {
    this.config = options.config || {};
    this.providerId = options.id || 'opencode:cli';
    this.spawnImpl = options.spawnImpl || spawn;
  }

  id() {
    return this.providerId;
  }

  async callApi(prompt, _context, callOptions = {}) {
    const providerId = this.config.provider_id;
    const model = this.config.model;
    if (!providerId || !model) {
      return { error: 'OpenCode CLI provider requires provider_id and model' };
    }

    try {
      const output = await runOpenCode(
        [
          'run',
          '--model',
          `${providerId}/${model}`,
          '--agent',
          this.config.agent || 'build',
          prompt,
        ],
        {
          cwd: path.resolve(EVAL_ROOT, this.config.working_dir || '../..'),
          env: {
            ...process.env,
            XDG_STATE_HOME: process.env.XDG_STATE_HOME || DEFAULT_STATE_HOME,
          },
          signal: callOptions.abortSignal,
          spawnImpl: this.spawnImpl,
        },
      );

      return { output: output.trim() };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }
}

function runOpenCode(args, options) {
  return new Promise((resolve, reject) => {
    const child = options.spawnImpl('opencode', args, {
      cwd: options.cwd || REPO_ROOT,
      env: options.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stdout = [];
    const stderr = [];
    let settled = false;

    const finish = (fn, value) => {
      if (settled) {
        return;
      }
      settled = true;
      if (options.signal) {
        options.signal.removeEventListener('abort', abort);
      }
      fn(value);
    };

    const abort = () => {
      child.kill('SIGTERM');
      finish(reject, new Error('OpenCode CLI call aborted'));
    };

    if (options.signal) {
      if (options.signal.aborted) {
        abort();
        return;
      }
      options.signal.addEventListener('abort', abort, { once: true });
    }

    child.stdout.on('data', (chunk) => stdout.push(chunk));
    child.stderr.on('data', (chunk) => stderr.push(chunk));
    child.on('error', (error) => finish(reject, error));
    child.on('close', (code) => {
      const output = Buffer.concat(stdout).toString('utf8');
      const errorOutput = Buffer.concat(stderr).toString('utf8').trim();
      if (code === 0) {
        finish(resolve, output);
        return;
      }

      finish(reject, new Error(errorOutput || `opencode exited with code ${code}`));
    });
  });
}

module.exports = OpenCodeCliProvider;
```

- [ ] **Step 4: Run the provider test and verify it passes**

Run:

```bash
npm --prefix tests/evals exec -- node --test scripts/opencode-cli-provider.test.js
```

Expected: PASS for all four provider tests.

- [ ] **Step 5: Commit the provider**

```bash
git add tests/evals/scripts/opencode-cli-provider.js tests/evals/scripts/opencode-cli-provider.test.js
git commit -m "AD-23 Add Promptfoo OpenCode CLI provider"
```

## Task 2: Remove OpenCode Server Management From the Promptfoo Wrapper

**Files:**

- Modify: `tests/evals/scripts/promptfoo.sh`
- Modify: `tests/evals/package.json`

- [ ] **Step 1: Add the provider test script**

Modify the `scripts` object in `tests/evals/package.json` so it includes:

```json
"test:opencode-cli-provider": "node --test scripts/opencode-cli-provider.test.js"
```

Keep the existing `test:promptfoo-db-gate`, `eval:*`, and `view` scripts unchanged.

- [ ] **Step 2: Run the new package script**

Run:

```bash
npm --prefix tests/evals run test:opencode-cli-provider
```

Expected: PASS.

- [ ] **Step 3: Rewrite the wrapper**

Replace `tests/evals/scripts/promptfoo.sh` with:

```sh
#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
NODE_BIN="${npm_node_execpath:-$(command -v node)}"
OPENCODE_XDG_ROOT="$SCRIPT_DIR/.promptfoo/opencode-runtime"

mkdir -p \
  "$SCRIPT_DIR/.promptfoo" \
  "$SCRIPT_DIR/.cache/promptfoo" \
  "$OPENCODE_XDG_ROOT/state"

# Load .env from repo root if present so evals inherit the same model credentials
# as local development without writing secrets into Promptfoo configs.
if [ -f "$REPO_ROOT/.env" ]; then
  set -a
  . "$REPO_ROOT/.env"
  set +a
fi

export PROMPTFOO_CACHE_PATH="$SCRIPT_DIR/.cache/promptfoo"
export PROMPTFOO_CONFIG_DIR="$SCRIPT_DIR/.promptfoo"
export XDG_STATE_HOME="$OPENCODE_XDG_ROOT/state"

exec "$NODE_BIN" "$SCRIPT_DIR/node_modules/promptfoo/dist/src/entrypoint.js" "$@"
```

- [ ] **Step 4: Verify the wrapper no longer starts a server**

Run:

```bash
rg -n "opencode serve|PROMPTFOO_MANAGE_OPENCODE|PROMPTFOO_OPENCODE_HOST|PROMPTFOO_OPENCODE_PORT|baseUrl" tests/evals/scripts/promptfoo.sh
```

Expected: no matches and exit code `1`.

- [ ] **Step 5: Run wrapper-adjacent tests**

Run:

```bash
npm --prefix tests/evals run test:opencode-cli-provider
npm run eval:coverage
npm run eval:codex-compatibility
```

Expected: all commands pass.

- [ ] **Step 6: Commit the wrapper cleanup**

```bash
git add tests/evals/scripts/promptfoo.sh tests/evals/package.json
git commit -m "AD-23 Remove OpenCode server management from eval wrapper"
```

## Task 3: Move Eval Package Providers to the CLI Provider

**Files:**

- Modify: every file matching `tests/evals/packages/**/*.yaml`

- [ ] **Step 1: Write a mechanical migration script in `/tmp`**

Create `/tmp/update-engineering-eval-providers.js` with this exact content:

```js
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = process.argv[2];
if (!repoRoot) {
  throw new Error('Usage: node /tmp/update-engineering-eval-providers.js <repo-root>');
}

const packagesRoot = path.join(repoRoot, 'tests', 'evals', 'packages');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walk(fullPath);
    }
    return entry.isFile() && /\.ya?ml$/.test(entry.name) ? [fullPath] : [];
  });
}

function replaceProviderBlock(text, filePath) {
  const replacement = [
    'providers:',
    '  - id: file://../../scripts/opencode-cli-provider.js',
    '    config:',
    '      provider_id: opencode',
    '      model: qwen3.6-plus',
  ].join('\n');

  const next = text.replace(
    /providers:\n  - id: opencode:sdk\n    config:\n      baseUrl: http:\/\/127\.0\.0\.1:4096\n      apiKey: promptfoo-local-baseurl-placeholder\n      working_dir: ([^\n]+)\n      max_turns: ([^\n]+)\n      tools:\n((?:        [^\n]+\n?)+)/,
    (_match, workingDir, maxTurns, toolsBlock) => `${replacement}\n      working_dir: ${workingDir}\n      max_turns: ${maxTurns}\n      tools:\n${toolsBlock.replace(/\s+$/u, '')}`,
  );

  if (next === text) {
    throw new Error(`Provider block was not updated in ${path.relative(repoRoot, filePath)}`);
  }

  return next;
}

for (const filePath of walk(packagesRoot)) {
  const text = fs.readFileSync(filePath, 'utf8');
  if (!text.includes('id: opencode:sdk')) {
    continue;
  }
  fs.writeFileSync(filePath, replaceProviderBlock(text, filePath), 'utf8');
}
```

- [ ] **Step 2: Run the migration script**

Run:

```bash
node /tmp/update-engineering-eval-providers.js "$PWD"
```

Expected: command exits `0` and updates all package YAML files that currently contain `id: opencode:sdk`.

- [ ] **Step 3: Verify no package still uses the SDK/server provider**

Run:

```bash
rg -n "opencode:sdk|baseUrl: http://127\\.0\\.0\\.1:4096|promptfoo-local-baseurl-placeholder" tests/evals/packages
```

Expected: no matches and exit code `1`.

- [ ] **Step 4: Verify all package configs use the provider file**

Run:

```bash
rg -n "id: file://../../scripts/opencode-cli-provider.js" tests/evals/packages | wc -l
```

Expected: the count equals the number of eval package YAML files with providers. At the time of writing, that count is `14`.

- [ ] **Step 5: Run deterministic checks**

Run:

```bash
npm run eval:coverage
npm run eval:codex-compatibility
```

Expected: both commands pass.

- [ ] **Step 6: Commit provider config migration**

```bash
git add tests/evals/packages
git commit -m "AD-23 Use OpenCode CLI provider in eval packages"
```

## Task 4: Add Harness Contract Tests Against Server Regression

**Files:**

- Create: `tests/evals/scripts/eval-harness-contract.test.js`
- Modify: `tests/evals/package.json`

- [ ] **Step 1: Write the contract test**

Create `tests/evals/scripts/eval-harness-contract.test.js`:

```js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const EVAL_ROOT = path.resolve(__dirname, '..');

function readText(relativePath) {
  return fs.readFileSync(path.join(EVAL_ROOT, relativePath), 'utf8');
}

function walkYaml(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walkYaml(fullPath);
    }
    return entry.isFile() && /\.ya?ml$/.test(entry.name) ? [fullPath] : [];
  });
}

test('promptfoo wrapper does not manage an OpenCode server', () => {
  const wrapper = readText('scripts/promptfoo.sh');

  assert.equal(wrapper.includes('opencode serve'), false);
  assert.equal(wrapper.includes('PROMPTFOO_MANAGE_OPENCODE'), false);
  assert.equal(wrapper.includes('PROMPTFOO_OPENCODE_HOST'), false);
  assert.equal(wrapper.includes('PROMPTFOO_OPENCODE_PORT'), false);
});

test('eval package providers use the OpenCode CLI provider instead of opencode:sdk baseUrl', () => {
  const packageFiles = walkYaml(path.join(EVAL_ROOT, 'packages'));
  assert.ok(packageFiles.length > 0, 'expected eval package YAML files');

  for (const filePath of packageFiles) {
    const relativePath = path.relative(EVAL_ROOT, filePath);
    const text = fs.readFileSync(filePath, 'utf8');

    assert.equal(text.includes('id: opencode:sdk'), false, `${relativePath} must not use opencode:sdk`);
    assert.equal(text.includes('baseUrl:'), false, `${relativePath} must not configure a server baseUrl`);
    assert.equal(
      text.includes('id: file://../../scripts/opencode-cli-provider.js'),
      true,
      `${relativePath} must use the OpenCode CLI provider`,
    );
  }
});
```

- [ ] **Step 2: Add the contract test script**

Modify the `scripts` object in `tests/evals/package.json` so it includes:

```json
"test:eval-harness-contract": "node --test scripts/eval-harness-contract.test.js"
```

- [ ] **Step 3: Run the harness tests**

Run:

```bash
npm --prefix tests/evals run test:opencode-cli-provider
npm --prefix tests/evals run test:eval-harness-contract
```

Expected: both commands pass.

- [ ] **Step 4: Commit the contract test**

```bash
git add tests/evals/scripts/eval-harness-contract.test.js tests/evals/package.json
git commit -m "AD-23 Guard eval harness against OpenCode server usage"
```

## Task 5: Verify the Previously Blocked Eval Path

**Files:**

- No source files should change in this task.

- [ ] **Step 1: Confirm the worktree is clean before evals**

Run:

```bash
git status --short
```

Expected: no output.

- [ ] **Step 2: Run the targeted maintain-github-repos eval**

Run:

```bash
npm run eval:maintain-github-repos
```

Expected: Promptfoo runs one test case through the custom provider. The command exits `0`; it must not print `Failed to start OpenCode server`.

- [ ] **Step 3: Run the PR-required deterministic checks**

Run:

```bash
npm run eval:coverage
npm run eval:codex-compatibility
```

Expected: both commands exit `0`.

- [ ] **Step 4: Confirm only allowed eval artifacts changed**

Run:

```bash
git status --short
```

Expected: no tracked source changes. Untracked or modified files under ignored eval artifact directories such as `tests/evals/.promptfoo/` and `tests/evals/.cache/` are acceptable only if they are ignored by Git and do not appear in `git status --short`.

- [ ] **Step 5: Commit only if verification caused required source changes**

If Task 5 reveals no source changes, do not create a commit. If it reveals a required source change, stop and write down the failing command and exact source file that needs a follow-up implementation task.

## Task 6: Update Repo Metadata and PR Evidence

**Files:**

- Modify: `repo-map.json`
- Modify: `docs/plan/2026-04-24-opencode-run-promptfoo-provider.md` only if implementation notes need correction.

- [ ] **Step 1: Update `repo-map.json` eval harness description**

In `repo-map.json`, update the eval harness or commands description so it says Promptfoo evals use a local OpenCode CLI provider that invokes `opencode run`, not an `opencode serve` server.

The updated text should preserve the current command names and should not duplicate the file tree. A suitable replacement sentence is:

```json
"description": "Promptfoo harness and deterministic compatibility checks for skills in this repository. Agentic eval packages use a local OpenCode CLI provider that invokes `opencode run` directly, avoiding a managed `opencode serve` process."
```

- [ ] **Step 2: Run JSON validation**

Run:

```bash
python3 -m json.tool repo-map.json >/tmp/engineering-skills-repo-map.json
```

Expected: exits `0`.

- [ ] **Step 3: Run final validation set**

Run:

```bash
npm --prefix tests/evals run test:opencode-cli-provider
npm --prefix tests/evals run test:eval-harness-contract
npm run eval:maintain-github-repos
npm run eval:coverage
npm run eval:codex-compatibility
```

Expected: all commands exit `0`.

- [ ] **Step 4: Commit metadata update**

```bash
git add repo-map.json
git commit -m "AD-23 Document OpenCode CLI eval runtime"
```

## Final Verification Before Raising PR

- [ ] Run `git status --short --branch` and confirm the branch is `feature/ad-23-add-partial-execution-modes-to-repo-maintenance-analyzer` with no uncommitted source changes.
- [ ] Run `git log --oneline origin/main..HEAD` and confirm the branch includes the original `AD-23` partial execution commit plus the eval harness commits from this plan.
- [ ] Run the `raising-linear-pr` workflow again for `AD-23`.
- [ ] In the PR body, include this verification evidence:

```md
Verification:
- python3 -m unittest test_analyze_repos.py
- npm --prefix tests/evals run test:opencode-cli-provider
- npm --prefix tests/evals run test:eval-harness-contract
- npm run eval:maintain-github-repos
- npm run eval:coverage
- npm run eval:codex-compatibility
```

## Self-Review

- Spec coverage: The plan covers replacing `opencode serve`, using `opencode run`, preserving existing eval scripts, updating package providers, adding regression tests, and re-running the previously blocked `AD-23` eval.
- Placeholder scan: No task contains unresolved placeholders, deferred implementation notes, or generic "add tests" instructions without concrete code.
- Type consistency: The provider class, constructor options, `callApi` signature, package provider config keys, and test assertions use the same names across all tasks.
