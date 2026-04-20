const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const helperPath = path.join(__dirname, 'promptfoo-db-gate.js');

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });
}

function runGit(repo, args, env = {}) {
  return run('git', args, {
    cwd: repo,
    env: { ...process.env, ...env },
  });
}

function createRepo() {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'promptfoo-db-gate-'));
  runGit(repo, ['init', '-q']);
  runGit(repo, ['config', 'user.email', 'agent@example.com']);
  runGit(repo, ['config', 'user.name', 'Agent']);
  fs.writeFileSync(path.join(repo, 'README.md'), 'initial\n');
  runGit(repo, ['add', 'README.md']);
  runGit(repo, ['commit', '-q', '-m', 'initial'], {
    GIT_AUTHOR_DATE: '2026-01-01T00:00:00Z',
    GIT_COMMITTER_DATE: '2026-01-01T00:00:00Z',
  });
  const base = runGit(repo, ['rev-parse', 'HEAD']).trim();
  return { repo, base };
}

function commitFile(repo, relativePath, content, message, date) {
  const fullPath = path.join(repo, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
  runGit(repo, ['add', relativePath]);
  runGit(repo, ['commit', '-q', '-m', message], {
    GIT_AUTHOR_DATE: date,
    GIT_COMMITTER_DATE: date,
  });
}

function createPromptfooDb(filePath, rows) {
  const statements = [
    "create table evals (id text primary key not null, created_at integer not null, description text);",
    "create table eval_results (id text, eval_id text, success integer);",
  ];

  for (const row of rows) {
    statements.push(
      `insert into evals (id, created_at, description) values ('${row.id}', ${row.createdAt}, '${row.description}');`,
    );
    for (const [index, success] of row.results.entries()) {
      statements.push(
        `insert into eval_results (id, eval_id, success) values ('${row.id}-${index}', '${row.id}', ${success ? 1 : 0});`,
      );
    }
  }

  run('sqlite3', [filePath, statements.join('\n')]);
}

function runGate({ repo, db, base, description = 'Eval description', paths = ['skills/example/SKILL.md'] }) {
  return JSON.parse(
    run('node', [
      helperPath,
      '--repo',
      repo,
      '--db',
      db,
      '--description',
      description,
      '--command',
      'eval:example',
      '--base',
      base,
      '--head',
      'HEAD',
      ...paths.flatMap((inputPath) => ['--path', inputPath]),
    ]),
  );
}

test('skips when latest passing eval is newer than latest content change', () => {
  const { repo, base } = createRepo();
  commitFile(repo, 'skills/example/SKILL.md', 'content\n', 'change skill', '2026-01-02T00:00:00Z');
  const db = path.join(repo, 'promptfoo.db');
  createPromptfooDb(db, [
    {
      id: 'eval-pass',
      createdAt: Date.parse('2026-01-03T00:00:00Z'),
      description: 'Eval description',
      results: [true, true],
    },
  ]);

  const result = runGate({ repo, db, base });

  assert.equal(result.decision, 'skip');
  assert.equal(result.reason, 'latest passing eval is newer than latest content change');
  assert.equal(result.latestPassingRun.evalId, 'eval-pass');
});

test('ignores unrelated newer commits when deciding staleness', () => {
  const { repo, base } = createRepo();
  commitFile(repo, 'skills/example/SKILL.md', 'content\n', 'change skill', '2026-01-02T00:00:00Z');
  commitFile(repo, 'docs/notes.md', 'notes\n', 'change docs', '2026-01-04T00:00:00Z');
  const db = path.join(repo, 'promptfoo.db');
  createPromptfooDb(db, [
    {
      id: 'eval-pass',
      createdAt: Date.parse('2026-01-03T00:00:00Z'),
      description: 'Eval description',
      results: [true, true],
    },
  ]);

  const result = runGate({ repo, db, base });

  assert.equal(result.decision, 'skip');
  assert.equal(result.latestContentChange.pathspecs, 'skills/example/SKILL.md');
});

test('runs when a content-relevant commit is newer than the latest passing eval', () => {
  const { repo, base } = createRepo();
  commitFile(repo, 'skills/example/SKILL.md', 'content\n', 'change skill', '2026-01-04T00:00:00Z');
  const db = path.join(repo, 'promptfoo.db');
  createPromptfooDb(db, [
    {
      id: 'eval-pass',
      createdAt: Date.parse('2026-01-03T00:00:00Z'),
      description: 'Eval description',
      results: [true, true],
    },
  ]);

  const result = runGate({ repo, db, base });

  assert.equal(result.decision, 'run');
  assert.equal(result.reason, 'latest content change is newer than latest passing eval');
});

test('runs when promptfoo DB is missing', () => {
  const { repo, base } = createRepo();
  commitFile(repo, 'skills/example/SKILL.md', 'content\n', 'change skill', '2026-01-02T00:00:00Z');

  const result = runGate({ repo, db: path.join(repo, 'missing.db'), base });

  assert.equal(result.decision, 'run');
  assert.equal(result.reason, 'promptfoo DB is missing');
  assert.equal(result.latestPassingRun, null);
});

