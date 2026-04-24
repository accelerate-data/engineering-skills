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
      model: 'gpt-5-nano',
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
    'opencode/gpt-5-nano',
    '--agent',
    'build',
    'Read the skill and summarize it.',
  ]);
  assert.equal(calls[0].options.stdio[0], 'ignore');
  assert.match(calls[0].options.cwd, /engineering-skills$/);
  assert.match(calls[0].options.env.XDG_DATA_HOME, /tests\/evals\/\.promptfoo\/opencode-runtime\/data$/);
  assert.match(calls[0].options.env.XDG_STATE_HOME, /tests\/evals\/\.promptfoo\/opencode-runtime\/state$/);
});

test('callApi returns stderr when opencode exits non-zero', async () => {
  const provider = new OpenCodeCliProvider({
    config: {
      provider_id: 'opencode',
      model: 'gpt-5-nano',
    },
    spawnImpl: () => createSpawnResult({ code: 1, stderr: 'model unavailable' }),
  });

  const result = await provider.callApi('prompt');

  assert.deepEqual(result, { error: 'model unavailable' });
});

test('callApi treats stderr-only successful exits as errors', async () => {
  const provider = new OpenCodeCliProvider({
    config: {
      provider_id: 'opencode',
      model: 'gpt-5-nano',
    },
    spawnImpl: () => createSpawnResult({ code: 0, stderr: 'model not found' }),
  });

  const result = await provider.callApi('prompt');

  assert.deepEqual(result, { error: 'model not found' });
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
      model: 'gpt-5-nano',
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
