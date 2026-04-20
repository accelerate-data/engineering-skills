#!/usr/bin/env node
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function parseArgs(argv) {
  const args = {
    repo: process.cwd(),
    db: path.join(process.cwd(), '.promptfoo/promptfoo.db'),
    head: 'HEAD',
    paths: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const name = argv[index];
    const value = argv[index + 1];
    if (!name.startsWith('--')) {
      throw new Error(`Unexpected argument: ${name}`);
    }
    if (value === undefined || value.startsWith('--')) {
      throw new Error(`Missing value for ${name}`);
    }
    index += 1;

    if (name === '--path') {
      args.paths.push(value);
    } else {
      args[name.slice(2)] = value;
    }
  }

  for (const required of ['description', 'command', 'base']) {
    if (!args[required]) {
      throw new Error(`Missing required argument --${required}`);
    }
  }
  if (args.paths.length === 0) {
    throw new Error('At least one --path is required');
  }

  return args;
}

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });
}

function latestContentChange({ repo, base, head, paths }) {
  const output = run(
    'git',
    ['-C', repo, 'log', '-1', '--format=%H%x00%cI', `${base}..${head}`, '--', ...paths],
  ).trim();

  if (!output) {
    return null;
  }

  const [commit, committedAt] = output.split('\0');
  return {
    commit,
    committedAt,
    committedAtMs: Date.parse(committedAt),
    pathspecs: paths.join(','),
  };
}

function quoteSqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function latestPassingRun({ db, description }) {
  if (!fs.existsSync(db)) {
    return { status: 'missing', run: null };
  }

  const sql = `
    select e.id, e.created_at
    from evals e
    join eval_results r on r.eval_id = e.id
    where e.description = ${quoteSqlString(description)}
    group by e.id
    having min(r.success) = 1 and count(r.id) > 0
    order by e.created_at desc
    limit 1;
  `;

  let output;
  try {
    output = run('sqlite3', ['-separator', '\t', db, sql]).trim();
  } catch (error) {
    return {
      status: 'unreadable',
      run: null,
      error: error.stderr ? String(error.stderr).trim() : error.message,
    };
  }

  if (!output) {
    return { status: 'none', run: null };
  }

  const [evalId, createdAtRaw] = output.split('\t');
  const createdAtMs = Number(createdAtRaw);
  return {
    status: 'found',
    run: {
      evalId,
      createdAt: createdAtRaw,
      createdAtMs,
      createdAtIso: Number.isFinite(createdAtMs) ? new Date(createdAtMs).toISOString() : null,
    },
  };
}

function decide({ command, paths, contentChange, passingRunResult }) {
  const base = {
    command,
    mappedInputs: paths,
    latestContentChange: contentChange,
    latestPassingRun: passingRunResult.run,
  };

  if (passingRunResult.status === 'missing') {
    return { ...base, decision: 'run', reason: 'promptfoo DB is missing' };
  }
  if (passingRunResult.status === 'unreadable') {
    return {
      ...base,
      decision: 'run',
      reason: 'promptfoo DB is unreadable',
      error: passingRunResult.error,
    };
  }
  if (passingRunResult.status === 'none') {
    return { ...base, decision: 'run', reason: 'no fully passing eval run found' };
  }
  if (!contentChange) {
    return { ...base, decision: 'skip', reason: 'no content-relevant change' };
  }
  if (contentChange.committedAtMs > passingRunResult.run.createdAtMs) {
    return {
      ...base,
      decision: 'run',
      reason: 'latest content change is newer than latest passing eval',
    };
  }

  return {
    ...base,
    decision: 'skip',
    reason: 'latest passing eval is newer than latest content change',
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const contentChange = latestContentChange(args);
  const passingRunResult = latestPassingRun(args);
  const result = decide({
    command: args.command,
    paths: args.paths,
    contentChange,
    passingRunResult,
  });

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(2);
  }
}
