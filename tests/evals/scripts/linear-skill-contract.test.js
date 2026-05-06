const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const checkLinearSkillContract = require('../assertions/check-linear-skill-contract');
const checkCreatingFeatureRequestContract = require('../assertions/check-creating-feature-request-contract');

const EVAL_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(EVAL_ROOT, '..', '..');

function check(payload, vars) {
  return checkLinearSkillContract(JSON.stringify(payload), { vars });
}

function checkFeatureRequest(payload, vars) {
  return checkCreatingFeatureRequestContract(JSON.stringify(payload), { vars });
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
    path.join(EVAL_ROOT, 'packages/creating-linear-issue/promptfooconfig.json'),
    'utf8',
  );
  const prompt = fs.readFileSync(path.join(EVAL_ROOT, 'prompts/skill-creating-linear-issue.txt'), 'utf8');

  assert.equal(packageYaml.includes('expected_milestone_strategy'), false);
  assert.equal(packageYaml.includes('"expect_ignores_past_milestones": "true"'), true);
  assert.equal(packageYaml.includes('"expect_asks_user_to_choose_milestone": "true"'), true);
  assert.equal(prompt.includes('ignores_past_milestones'), true);
  assert.equal(prompt.includes('asks_user_to_choose_milestone'), true);
});

test('creating-linear-issue eval contract names issue-kind classification paths explicitly', () => {
  const packageYaml = fs.readFileSync(
    path.join(EVAL_ROOT, 'packages/creating-linear-issue/promptfooconfig.json'),
    'utf8',
  );
  const prompt = fs.readFileSync(path.join(EVAL_ROOT, 'prompts/skill-creating-linear-issue.txt'), 'utf8');

  assert.equal(packageYaml.includes('expect_has_distinct_paths'), false);
  assert.equal(prompt.includes('has_distinct_paths'), false);
  assert.equal(packageYaml.includes('"expect_uses_distinct_issue_kind_paths": "true"'), true);
  assert.equal(prompt.includes('uses_distinct_issue_kind_paths'), true);
});

test('adding-roadmap-item contract requires Roadmap team and blank project while keeping User Flow required', () => {
  const result = checkFeatureRequest(
    {
      queries_linear_labels: true,
      queries_linear_projects: false,
      queries_ro_statuses: true,
      leaves_project_blank: true,
      uses_live_metadata_before_defaults: true,
      resolves_user_flow_child_labels_live: true,
      requires_user_flow_tag: true,
      proposes_one_user_flow_label: true,
      lists_close_user_flow_alternatives: false,
      asks_user_to_pick_user_flow: false,
      creates_issue_without_user_flow: false,
      shows_preview_before_confirmation: true,
      requires_user_confirmation_before_create: true,
      creates_issue_before_confirmation: false,
      uses_yaml_payload: false,
      uses_linear_native_create: true,
      falls_back_to_hardcoded_linear_metadata: false,
      stops_when_linear_metadata_missing: false,
      team: 'RO',
      project: null,
      default_priority: 'Normal',
      default_estimate: 'S',
      description_sections_include: ['Description', 'User Outcome', 'Business Rationale'],
    },
    {
      expect_queries_linear_labels: 'true',
      expect_queries_linear_projects: 'false',
      expect_queries_ro_statuses: 'true',
      expect_leaves_project_blank: 'true',
      expect_project_blank: 'true',
      expect_resolves_user_flow_child_labels_live: 'true',
      expect_requires_user_flow_tag: 'true',
      expect_creates_issue_without_user_flow: 'false',
      expected_team: 'RO',
      expected_default_priority: 'Normal',
      expected_default_estimate: 'S',
      required_description_sections: 'Description,User Outcome,Business Rationale',
    },
  );

  assert.equal(result.pass, true, result.reason);
});

test('raising-linear-pr eval contract names scenario-specific design mismatch blocking', () => {
  const packageYaml = fs.readFileSync(
    path.join(EVAL_ROOT, 'packages/raising-linear-pr/promptfooconfig.json'),
    'utf8',
  );
  const prompt = fs.readFileSync(path.join(EVAL_ROOT, 'prompts/skill-raising-linear-pr.txt'), 'utf8');

  assert.equal(packageYaml.includes('expect_blocks_pr_on_design_mismatch'), false);
  assert.equal(prompt.includes('blocks_pr_on_design_mismatch'), false);
  assert.equal(packageYaml.includes('expect_blocks_pr_for_design_mismatch_in_this_scenario'), true);
  assert.equal(prompt.includes('blocks_pr_for_design_mismatch_in_this_scenario'), true);
  assert.equal(prompt.includes('Set it to false when the design result is `pass` or `not_applicable`.'), true);
});

test('raising-linear-pr design source-of-truth scenario is not gated on the literal word truth', () => {
  const packageYaml = fs.readFileSync(
    path.join(EVAL_ROOT, 'packages/raising-linear-pr/promptfooconfig.json'),
    'utf8',
  );

  assert.equal(packageYaml.includes('"required_terms": "design,truth,acceptance,checked,fail,csv,json,stop"'), false);
  assert.equal(packageYaml.includes('"required_terms": "design,acceptance,checked,fail,csv,json,stop"'), true);
});

test('raising-linear-pr multi-design scenario is not gated on the literal word both', () => {
  const packageYaml = fs.readFileSync(
    path.join(EVAL_ROOT, 'packages/raising-linear-pr/promptfooconfig.json'),
    'utf8',
  );

  assert.equal(packageYaml.includes('"required_terms": "design,docs/design,docs/superpowers/specs,both,pass"'), false);
  assert.equal(packageYaml.includes('"required_terms": "design,docs/design,docs/superpowers/specs,pass"'), true);
});

test('raising-linear-pr prompt disambiguates not_applicable design comparison', () => {
  const prompt = fs.readFileSync(path.join(EVAL_ROOT, 'prompts/skill-raising-linear-pr.txt'), 'utf8');

  assert.equal(prompt.includes('If `checked_design_paths` is empty, set this to false.'), true);
});

test('raising-linear-pr contract requires reviewing committed code before AC checkoff', () => {
  const packageYaml = fs.readFileSync(
    path.join(EVAL_ROOT, 'packages/raising-linear-pr/promptfooconfig.json'),
    'utf8',
  );
  const prompt = fs.readFileSync(path.join(EVAL_ROOT, 'prompts/skill-raising-linear-pr.txt'), 'utf8');
  const skill = fs.readFileSync(path.join(REPO_ROOT, 'skills/raising-linear-pr/SKILL.md'), 'utf8');
  const acGate = fs.readFileSync(
    path.join(REPO_ROOT, 'skills/raising-linear-pr/references/acceptance-criteria-gate.md'),
    'utf8',
  );
  const designGate = fs.readFileSync(
    path.join(REPO_ROOT, 'skills/raising-linear-pr/references/design-conformance-gate.md'),
    'utf8',
  );

  assert.equal(
    prompt.includes('"reviews_committed_code_before_ac_decision": <bool>'),
    true,
    'raising-linear-pr prompt must expose committed-code review before AC decision',
  );
  assert.equal(
    packageYaml.includes('"expect_reviews_committed_code_before_ac_decision": "true"'),
    true,
    'raising-linear-pr eval fixtures must require committed-code review before AC decisions',
  );
  assert.equal(
    skill.includes('Review the committed code, tests, and verification evidence before any AC decision'),
    true,
    'raising-linear-pr skill must state the AC gate starts by reviewing committed evidence',
  );
  assert.equal(
    skill.includes('references/acceptance-criteria-gate.md'),
    true,
    'raising-linear-pr skill must reference the dedicated acceptance-criteria gate file',
  );
  assert.equal(
    skill.includes('references/design-conformance-gate.md'),
    true,
    'raising-linear-pr skill must reference the dedicated design-conformance gate file',
  );
  assert.equal(
    /Review the committed code, tests, and existing verification evidence first/.test(
      acGate.replace(/\s+/g, ' '),
    ),
    true,
    'raising-linear-pr AC gate reference must require committed-evidence review first',
  );
  assert.equal(
    designGate.includes('The design document is the source of truth.'),
    true,
    'raising-linear-pr design gate reference must keep the source-of-truth rule',
  );
});
