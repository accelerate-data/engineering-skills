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
