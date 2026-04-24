const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const checkLinearSkillContract = require('../assertions/check-linear-skill-contract');

const EVAL_ROOT = path.resolve(__dirname, '..');

function check(payload, vars) {
  return checkLinearSkillContract(JSON.stringify(payload), { vars });
}

test('accepts User Flow spelling as the user_flow_label resolved field', () => {
  const result = check(
    {
      resolved_fields_include: ['project', 'milestone', 'assignee', 'cycle', 'User Flow'],
    },
    {
      expected_resolved_fields_include: 'user_flow_label',
    },
  );

  assert.equal(result.pass, true, result.reason);
});

test('accepts issue_creator as a creator assignee default alias', () => {
  const result = check(
    {
      assignee_default: 'issue_creator',
    },
    {
      expected_assignee_default: 'creator',
    },
  );

  assert.equal(result.pass, true, result.reason);
});

test('creating-linear-issue eval contract splits milestone filtering from milestone choice', () => {
  const packageYaml = fs.readFileSync(
    path.join(EVAL_ROOT, 'packages/creating-linear-issue/skill-creating-linear-issue.yaml'),
    'utf8',
  );
  const prompt = fs.readFileSync(path.join(EVAL_ROOT, 'prompts/skill-creating-linear-issue.txt'), 'utf8');

  assert.equal(packageYaml.includes('expected_milestone_strategy'), false);
  assert.equal(packageYaml.includes('expect_ignores_past_milestones: "true"'), true);
  assert.equal(packageYaml.includes('expect_asks_user_to_choose_milestone: "true"'), true);
  assert.equal(prompt.includes('ignores_past_milestones'), true);
  assert.equal(prompt.includes('asks_user_to_choose_milestone'), true);
});

test('creating-linear-issue eval contract names issue-kind classification paths explicitly', () => {
  const packageYaml = fs.readFileSync(
    path.join(EVAL_ROOT, 'packages/creating-linear-issue/skill-creating-linear-issue.yaml'),
    'utf8',
  );
  const prompt = fs.readFileSync(path.join(EVAL_ROOT, 'prompts/skill-creating-linear-issue.txt'), 'utf8');

  assert.equal(packageYaml.includes('expect_has_distinct_paths'), false);
  assert.equal(prompt.includes('has_distinct_paths'), false);
  assert.equal(packageYaml.includes('expect_uses_distinct_issue_kind_paths: "true"'), true);
  assert.equal(prompt.includes('uses_distinct_issue_kind_paths'), true);
});
