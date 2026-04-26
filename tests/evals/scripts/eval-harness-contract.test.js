const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const YAML = require('yaml');

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

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasFailureModes(value) {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.some((item) => hasFailureModes(item));
  }

  return false;
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

test('user-behavior eval cases declare failure modes', () => {
  const packageFiles = walkYaml(path.join(EVAL_ROOT, 'packages'));
  assert.ok(packageFiles.length > 0, 'expected eval package YAML files');

  for (const filePath of packageFiles) {
    const relativePath = path.relative(EVAL_ROOT, filePath);
    const config = YAML.parse(fs.readFileSync(filePath, 'utf8'));
    const defaultVars = isObject(config?.defaultTest?.vars) ? config.defaultTest.vars : {};
    const tests = Array.isArray(config?.tests) ? config.tests : [];

    tests.forEach((testConfig, index) => {
      const testVars = isObject(testConfig?.vars) ? testConfig.vars : {};
      const effectiveVars = { ...defaultVars, ...testVars };

      if (effectiveVars.eval_type === 'user-behavior') {
        assert.equal(
          hasFailureModes(effectiveVars.failure_modes),
          true,
          `${relativePath} test ${index + 1} must declare failure_modes for user-behavior cases`,
        );
      }
    });
  }
});
