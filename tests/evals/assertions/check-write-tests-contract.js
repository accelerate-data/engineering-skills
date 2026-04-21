const { extractJsonObject, normalizeTerms } = require('./schema-helpers');

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

  const checks = [
    ['checks_session_separation_before_mode_detection', parseExpectedBoolean(context.vars.expect_checks_session_separation_before_mode_detection)],
    ['runs_phase_0_discovery', parseExpectedBoolean(context.vars.expect_runs_phase_0_discovery)],
    ['presents_file_list_before_step_1', parseExpectedBoolean(context.vars.expect_presents_file_list_before_step_1)],
    ['skips_trivial_config', parseExpectedBoolean(context.vars.expect_skips_trivial_config)],
    ['posts_todo_checklist', parseExpectedBoolean(context.vars.expect_posts_todo_checklist)],
    ['assumes_test_runner', parseExpectedBoolean(context.vars.expect_assumes_test_runner)],
    ['discovers_test_runner_from_project_files', parseExpectedBoolean(context.vars.expect_discovers_test_runner_from_project_files)],
    ['skips_step_2_audit', parseExpectedBoolean(context.vars.expect_skips_step_2_audit)],
    ['step_2_check_required', parseExpectedBoolean(context.vars.expect_step_2_check_required)],
    ['leads_with_recommendation', parseExpectedBoolean(context.vars.expect_leads_with_recommendation)],
    ['would_write_tests_in_same_implementation_session', parseExpectedBoolean(context.vars.expect_would_write_tests_in_same_implementation_session)],
  ];

  for (const [field, expected] of checks) {
    if (expected === null) continue;
    if (payload[field] !== expected) {
      return {
        pass: false,
        score: 0,
        reason: `Expected ${field}=${expected}, got ${payload[field]}`,
      };
    }
  }

  if (context.vars.expect_mode_detected !== undefined) {
    const expected = String(context.vars.expect_mode_detected).trim().toLowerCase();
    const actual = String(payload.mode_detected || '').trim().toLowerCase();
    if (actual !== expected) {
      return {
        pass: false,
        score: 0,
        reason: `Expected mode_detected=${expected}, got ${actual}`,
      };
    }
  }

  if (context.vars.expect_proposed_file_order_includes !== undefined) {
    const expected = normalizeTerms(context.vars.expect_proposed_file_order_includes);
    const actual = Array.isArray(payload.proposed_file_order)
      ? payload.proposed_file_order.map((v) => String(v).trim().toLowerCase())
      : [];
    const missing = expected.filter((term) => !actual.some((a) => a.includes(term)));
    if (missing.length > 0) {
      return {
        pass: false,
        score: 0,
        reason: `Missing files in proposed_file_order: ${missing.join(', ')}`,
      };
    }
  }

  const requiredTerms = normalizeTerms(context.vars.required_terms);
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

  const forbiddenTerms = normalizeTerms(context.vars.forbidden_terms);
  if (forbiddenTerms.length > 0) {
    const haystack = JSON.stringify(payload).toLowerCase();
    const found = forbiddenTerms.filter((term) => haystack.includes(term));
    if (found.length > 0) {
      return {
        pass: false,
        score: 0,
        reason: `Found forbidden terms: ${found.join(', ')}`,
      };
    }
  }

  return {
    pass: true,
    score: 1,
    reason: 'write-tests skill contract matched expected workflow',
  };
};
