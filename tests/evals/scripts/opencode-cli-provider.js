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
