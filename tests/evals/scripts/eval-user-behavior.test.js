const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { checkEvalUserBehavior } = require('./check-eval-user-behavior');

const LINEAR_ADJACENT_SKILLS = [
  'creating-feature-request',
  'creating-linear-issue',
  'implementing-linear-issue',
  'raising-linear-pr',
  'closing-linear-issue',
  'yolo',
];

function writeFile(root, relativePath, text) {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, text);
}

function makeRepo(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'eval-user-behavior-'));
  for (const [relativePath, text] of Object.entries(files)) {
    writeFile(root, relativePath, text);
  }
  return root;
}

function packageFixture(skillName, vars = []) {
  return [
    'tests:',
    `  - description: ${skillName}`,
    '    vars:',
    '      scenario: "The user asks for Linear-adjacent work."',
    '      simulated_context: "The scenario includes all required Linear facts."',
    '      eval_type: user-behavior',
    '      failure_modes: "uses-live-linear"',
    ...vars,
  ].join('\n');
}

test('linear-adjacent prompts require explicit no-read and no-write instructions', () => {
  const root = makeRepo({
    'tests/evals/prompts/skill-creating-linear-issue.txt': [
      'You are evaluating creating-linear-issue.',
      'Scenario:',
      '{{scenario}}',
    ].join('\n'),
    'tests/evals/packages/creating-linear-issue/skill-creating-linear-issue.yaml': packageFixture(
      'creating-linear-issue',
    ),
  });

  const result = checkEvalUserBehavior(root);

  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /must forbid reading Linear/);
  assert.match(result.errors.join('\n'), /must forbid writing Linear/);
  assert.match(result.errors.join('\n'), /must state required Linear facts are supplied/);
});

test('all linear-adjacent prompts pass when Linear isolation is explicit', () => {
  const root = makeRepo(
    Object.fromEntries(
      LINEAR_ADJACENT_SKILLS.flatMap((skillName) => [
        [
          `tests/evals/prompts/skill-${skillName}.txt`,
          [
            `You are evaluating ${skillName}.`,
            'Do not read Linear, write Linear, contact Linear, or call Linear tools.',
            'All required Linear facts are supplied in the scenario and simulated context.',
            'Scenario:',
            '{{scenario}}',
          ].join('\n'),
        ],
        [
          `tests/evals/packages/${skillName}/skill-${skillName}.yaml`,
          packageFixture(skillName),
        ],
      ]),
    ),
  );

  const result = checkEvalUserBehavior(root);

  assert.equal(result.ok, true, result.errors.join('\n'));
});

test('user-behavior fixtures require failure_modes metadata', () => {
  const root = makeRepo({
    'tests/evals/prompts/skill-code-simplifier.txt': [
      'You are evaluating code-simplifier.',
      'Scenario:',
      '{{scenario}}',
    ].join('\n'),
    'tests/evals/packages/code-simplifier/skill-code-simplifier.yaml': [
      'tests:',
      '  - description: simplify code',
      '    vars:',
      '      scenario: "The user asks for simpler code."',
      '      eval_type: user-behavior',
    ].join('\n'),
  });

  const result = checkEvalUserBehavior(root);

  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /user-behavior tests must declare failure_modes/);
});

test('user-behavior fixtures without description still require failure_modes metadata', () => {
  const root = makeRepo({
    'tests/evals/prompts/skill-code-simplifier.txt': [
      'You are evaluating code-simplifier.',
      'Scenario:',
      '{{scenario}}',
    ].join('\n'),
    'tests/evals/packages/code-simplifier/skill-code-simplifier.yaml': [
      'tests:',
      '  - vars:',
      '      scenario: "The user asks for simpler code."',
      '      eval_type: user-behavior',
    ].join('\n'),
  });

  const result = checkEvalUserBehavior(root);

  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /user-behavior tests must declare failure_modes/);
});

test('user-behavior fixtures accept list-style failure_modes metadata', () => {
  const root = makeRepo({
    'tests/evals/prompts/skill-code-simplifier.txt': [
      'You are evaluating code-simplifier.',
      'Scenario:',
      '{{scenario}}',
    ].join('\n'),
    'tests/evals/packages/code-simplifier/skill-code-simplifier.yaml': [
      'tests:',
      '  - description: simplify code',
      '    vars:',
      '      scenario: "The user asks for simpler code."',
      '      eval_type: user-behavior',
      '      failure_modes:',
      '        - preserves-dead-code',
      '        - over-refactors',
    ].join('\n'),
  });

  const result = checkEvalUserBehavior(root);

  assert.equal(result.ok, true, result.errors.join('\n'));
});

test('tests inheriting user-behavior eval_type require failure_modes metadata', () => {
  const root = makeRepo({
    'tests/evals/prompts/skill-code-simplifier.txt': [
      'You are evaluating code-simplifier.',
      'Scenario:',
      '{{scenario}}',
    ].join('\n'),
    'tests/evals/packages/code-simplifier/skill-code-simplifier.yaml': [
      'defaultTest:',
      '  vars:',
      '    eval_type: user-behavior',
      'tests:',
      '  - description: simplify code',
      '    vars:',
      '      scenario: "The user asks for simpler code."',
    ].join('\n'),
  });

  const result = checkEvalUserBehavior(root);

  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /user-behavior tests must declare failure_modes/);
});

test('tests inheriting user-behavior eval_type accept inherited failure_modes metadata', () => {
  const root = makeRepo({
    'tests/evals/prompts/skill-code-simplifier.txt': [
      'You are evaluating code-simplifier.',
      'Scenario:',
      '{{scenario}}',
    ].join('\n'),
    'tests/evals/packages/code-simplifier/skill-code-simplifier.yaml': [
      'defaultTest:',
      '  vars:',
      '    eval_type: user-behavior',
      '    failure_modes:',
      '      - misses-user-intent',
      'tests:',
      '  - description: simplify code',
      '    vars:',
      '      scenario: "The user asks for simpler code."',
    ].join('\n'),
  });

  const result = checkEvalUserBehavior(root);

  assert.equal(result.ok, true, result.errors.join('\n'));
});

test('linear-adjacent prompts fail when only reads are forbidden', () => {
  const root = makeRepo({
    'tests/evals/prompts/skill-creating-linear-issue.txt': [
      'You are evaluating creating-linear-issue.',
      'Do not read Linear.',
      'You may write Linear if the skill asks for it.',
      'All required Linear facts are supplied in the scenario and simulated context.',
      'Scenario:',
      '{{scenario}}',
    ].join('\n'),
    'tests/evals/packages/creating-linear-issue/skill-creating-linear-issue.yaml': packageFixture(
      'creating-linear-issue',
    ),
  });

  const result = checkEvalUserBehavior(root);

  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /must forbid writing Linear/);
});

test('linear-adjacent prompts fail when Linear facts are explicitly not supplied', () => {
  const root = makeRepo({
    'tests/evals/prompts/skill-creating-linear-issue.txt': [
      'You are evaluating creating-linear-issue.',
      'Do not read Linear, write Linear, contact Linear, or call Linear tools.',
      'Required Linear facts are not supplied by the scenario.',
      'Scenario:',
      '{{scenario}}',
    ].join('\n'),
    'tests/evals/packages/creating-linear-issue/skill-creating-linear-issue.yaml': packageFixture(
      'creating-linear-issue',
    ),
  });

  const result = checkEvalUserBehavior(root);

  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /must state required Linear facts are supplied/);
});

test('non-user-behavior fixtures do not require failure_modes metadata', () => {
  const root = makeRepo({
    'tests/evals/prompts/skill-code-simplifier.txt': [
      'You are evaluating code-simplifier.',
      'Scenario:',
      '{{scenario}}',
    ].join('\n'),
    'tests/evals/packages/code-simplifier/skill-code-simplifier.yaml': [
      'tests:',
      '  - description: simplify code',
      '    vars:',
      '      scenario: "The user asks for simpler code."',
      '      eval_type: contract-oracle',
    ].join('\n'),
  });

  const result = checkEvalUserBehavior(root);

  assert.equal(result.ok, true, result.errors.join('\n'));
});
