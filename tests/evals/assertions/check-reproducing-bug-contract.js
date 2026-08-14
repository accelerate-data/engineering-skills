const { extractJsonObject, normalizeTerms } = require('./schema-helpers');

const BOOLEAN_FIELDS = [
  'skill_applies',
  'reproduces_before_naming_cause',
  'presents_unproven_cause_as_root_cause',
  'marks_links_confirmed_or_guessed',
  'drives_setup_through_ui',
  'escalates_to_user',
  'reports_all_preconditions_at_once',
  'rechecks_precondition_before_use',
  'treats_blocker_as_separate_finding',
  'files_or_commits_without_asking',
  'verifies_log_query_shape',
  'continues_past_report_to_test',
  'also_needs_browser_test',
  'mocks_at_network_boundary',
  'requires_canary_and_flip_proof',
  'predicts_existing_test_must_change',
  'extends_fake',
  'drafts_spike_instead_of_test',
  'probes_untested_criteria',
  'asks_clarifying_question',
  'report_leads_with_verdict',
  'verdict_states_partial_when_partial',
  'writes_named_browser_test',
];

const VALID_LANES = [
  'unit-fe',
  'unit-be',
  'flow',
  'flow-real-agent',
  'journey',
  'journey-real-runtime',
  'container',
  'fake-unit',
  'structural',
  'none',
];

// Invariants. These hold in every scenario, so a run that breaks one fails
// regardless of what the test case asked for.
const NEVER_TRUE = [
  ['presents_unproven_cause_as_root_cause', 'a cause never seen in a run is a guess, not a root cause'],
  ['files_or_commits_without_asking', 'filing, committing, pushing and opening a PR are all the user decision'],
  ['predicts_existing_test_must_change', 'an existing test is reported as "may need updating", never as must-change'],
];

function parseExpectedBoolean(value) {
  if (value === undefined) return null;
  return String(value).trim().toLowerCase() === 'true';
}

function expectedFieldName(varName) {
  return varName.startsWith('expect_') ? varName.slice('expect_'.length) : null;
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeSkillPath(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\/skill\.md$/, '');
}

function hasStrictSingleLineJsonEnvelope(output) {
  if (typeof output !== 'string') return false;
  if (output !== output.trim()) return false;

  const trimmed = output.trim();
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return false;
  if (trimmed.includes('\n') || trimmed.includes('\r')) return false;

  return true;
}

function fail(reason) {
  return { pass: false, score: 0, reason };
}

module.exports = (output, context) => {
  if (!hasStrictSingleLineJsonEnvelope(output)) {
    return fail('Expected a single-line JSON object with no preamble or trailing text');
  }

  let payload;
  try {
    payload = extractJsonObject(output);
  } catch (error) {
    return fail(`Failed to parse JSON output: ${error.message}`);
  }

  if (!isNonEmptyString(payload.skill_path)) {
    return fail('Expected skill_path to be a non-empty string');
  }

  for (const field of BOOLEAN_FIELDS) {
    if (typeof payload[field] !== 'boolean') {
      return fail(`Expected ${field} to be boolean, got ${typeof payload[field]}`);
    }
  }

  for (const [field, why] of NEVER_TRUE) {
    if (payload[field] === true) {
      return fail(`${field} must never be true — ${why}`);
    }
  }

  if (!VALID_LANES.includes(payload.lane)) {
    return fail(`lane must be one of ${VALID_LANES.join(', ')}, got "${payload.lane}"`);
  }

  if (!Array.isArray(payload.obligations) || payload.obligations.length === 0) {
    return fail('Expected obligations to be a non-empty array');
  }

  if (!payload.obligations.every(isNonEmptyString)) {
    return fail('Expected every obligation to be a non-empty string');
  }

  if (!isNonEmptyString(payload.notes)) {
    return fail('Expected notes to be a non-empty string');
  }

  for (const [varName, varValue] of Object.entries(context.vars || {})) {
    const field = expectedFieldName(varName);
    if (!field || field === 'skill_path' || field === 'lane') continue;

    const expected = parseExpectedBoolean(varValue);
    if (expected === null) continue;

    if (payload[field] !== expected) {
      return fail(`Expected ${field}=${expected}, got ${payload[field]}`);
    }
  }

  if (context.vars.expect_lane !== undefined && payload.lane !== context.vars.expect_lane) {
    return fail(`Expected lane="${context.vars.expect_lane}", got "${payload.lane}"`);
  }

  if (context.vars.expected_skill_path !== undefined) {
    const expected = normalizeSkillPath(context.vars.expected_skill_path);
    const actual = normalizeSkillPath(payload.skill_path);
    if (!actual.includes(expected)) {
      return fail(`Expected skill_path to include ${expected}, got ${actual}`);
    }
  }

  const requiredTerms = normalizeTerms(context.vars.required_terms);
  if (requiredTerms.length > 0) {
    const haystack = JSON.stringify(payload).toLowerCase();
    const missing = requiredTerms.filter((term) => !haystack.includes(term));
    if (missing.length > 0) {
      return fail(`Missing required terms: ${missing.join(', ')}`);
    }
  }

  return { pass: true, score: 1, reason: 'reproducing-bug contract matched expected behavior' };
};
