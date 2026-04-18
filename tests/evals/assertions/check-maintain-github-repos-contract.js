const { extractJsonObject } = require('./schema-helpers');

function parseExpectedBoolean(value) {
  if (value === undefined) return null;
  return String(value).trim().toLowerCase() === 'true';
}

module.exports = (output, context) => {
  let payload;
  try {
    payload = extractJsonObject(output);
  } catch (error) {
    return {
      pass: false,
      score: 0,
      reason: `Failed to parse JSON output: ${error.message}`,
    };
  }

  const boolChecks = [
    ['uses_repo_local_script_path', parseExpectedBoolean(context.vars.expect_uses_repo_local_script_path)],
    ['mentions_accelerate_data_only', parseExpectedBoolean(context.vars.expect_mentions_accelerate_data_only)],
    ['requires_dry_run_before_execute', parseExpectedBoolean(context.vars.expect_requires_dry_run_before_execute)],
    ['requires_user_confirmation_before_execute', parseExpectedBoolean(context.vars.expect_requires_user_confirmation_before_execute)],
    ['requires_full_bulk_set_approval', parseExpectedBoolean(context.vars.expect_requires_full_bulk_set_approval)],
    ['stops_on_partial_approval', parseExpectedBoolean(context.vars.expect_stops_on_partial_approval)],
    ['includes_dev_repo_delete_rule', parseExpectedBoolean(context.vars.expect_includes_dev_repo_delete_rule)],
    [
      'uses_activity_not_archive_timestamp_for_scratch_delete',
      parseExpectedBoolean(context.vars.expect_uses_activity_not_archive_timestamp_for_scratch_delete),
    ],
    [
      'flags_large_branch_count_for_manual_review',
      parseExpectedBoolean(context.vars.expect_flags_large_branch_count_for_manual_review),
    ],
    ['surfaces_threshold_constants', parseExpectedBoolean(context.vars.expect_surfaces_threshold_constants)],
  ];

  for (const [field, expected] of boolChecks) {
    if (expected === null) continue;
    if (payload[field] !== expected) {
      return {
        pass: false,
        score: 0,
        reason: `Expected ${field}=${expected}, got ${payload[field]}`,
      };
    }
  }

  if (context.vars.expected_script_path !== undefined) {
    const expected = String(context.vars.expected_script_path).trim().toLowerCase();
    const actual = String(payload.script_path || '').trim().toLowerCase();
    if (!actual.includes(expected)) {
      return {
        pass: false,
        score: 0,
        reason: `Expected script_path to include ${expected}, got ${actual}`,
      };
    }
  }

  const requiredTerms = String(context.vars.required_terms || '')
    .split(',')
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean);

  if (requiredTerms.length > 0) {
    const haystack = JSON.stringify(payload).toLowerCase();
    const missing = requiredTerms.filter((term) => !haystack.includes(term));
    if (missing.length > 0) {
      return {
        pass: false,
        score: 0,
        reason: `Missing required terms: ${missing.join(', ')}`,
      };
    }
  }

  return {
    pass: true,
    score: 1,
    reason: 'Maintain-github-repos skill contract matched expected behavior',
  };
};
