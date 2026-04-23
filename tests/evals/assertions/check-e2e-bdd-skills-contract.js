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

  // Common BDD skill contract checks
  const checks = [
    ['halts_on_missing_database_path', parseExpectedBoolean(context.vars.expect_halts_on_missing_database_path)],
    ['resolves_harness_root_from_env_var', parseExpectedBoolean(context.vars.expect_resolves_harness_root_from_env_var)],
    ['falls_back_to_cwd_when_env_not_set', parseExpectedBoolean(context.vars.expect_falls_back_to_cwd_when_env_not_set)],
    ['uses_e2e_app_src_when_set', parseExpectedBoolean(context.vars.expect_uses_e2e_app_src_when_set)],
    ['emits_run_id_on_data_literals', parseExpectedBoolean(context.vars.expect_emits_run_id_on_data_literals)],
    ['uses_step_vocabulary_only', parseExpectedBoolean(context.vars.expect_uses_step_vocabulary_only)],
    ['emits_missing_step_comment', parseExpectedBoolean(context.vars.expect_emits_missing_step_comment)],
    ['no_hardcoded_app_path', parseExpectedBoolean(context.vars.expect_no_hardcoded_app_path)],
    // adding-scenario specific
    ['appends_not_replaces', parseExpectedBoolean(context.vars.expect_appends_not_replaces)],
    ['refuses_to_emit_feature_heading', parseExpectedBoolean(context.vars.expect_refuses_to_emit_feature_heading)],
    ['handoffs_to_authoring_when_file_missing', parseExpectedBoolean(context.vars.expect_handoffs_to_authoring_when_file_missing)],
    // authoring-feature-file specific
    ['refuses_to_overwrite_existing_file', parseExpectedBoolean(context.vars.expect_refuses_to_overwrite_existing_file)],
    ['copies_sibling_background_verbatim', parseExpectedBoolean(context.vars.expect_copies_sibling_background_verbatim)],
    ['includes_teardown_scenario', parseExpectedBoolean(context.vars.expect_includes_teardown_scenario)],
    ['confirms_new_category_with_user', parseExpectedBoolean(context.vars.expect_confirms_new_category_with_user)],
    // extending-step-vocabulary specific
    ['classifies_backend_before_adding', parseExpectedBoolean(context.vars.expect_classifies_backend_before_adding)],
    ['refuses_cross_backend_step', parseExpectedBoolean(context.vars.expect_refuses_cross_backend_step)],
    ['includes_failure_mode_note', parseExpectedBoolean(context.vars.expect_includes_failure_mode_note)],
    ['includes_dual_dialect_for_db', parseExpectedBoolean(context.vars.expect_includes_dual_dialect_for_db)],
    // regenerating-from-guide specific
    ['runs_generate_script_not_manual_gherkin', parseExpectedBoolean(context.vars.expect_runs_generate_script_not_manual_gherkin)],
    ['requires_separate_mappings_commit', parseExpectedBoolean(context.vars.expect_requires_separate_mappings_commit)],
    ['requires_diff_review_before_commit', parseExpectedBoolean(context.vars.expect_requires_diff_review_before_commit)],
    ['refuses_to_regen_without_guide', parseExpectedBoolean(context.vars.expect_refuses_to_regen_without_guide)],
    // skill-module awareness
    ['checks_skill_modules_before_missing_step', parseExpectedBoolean(context.vars.expect_checks_skill_modules_before_missing_step)],
    ['routes_complex_logic_to_skill_module', parseExpectedBoolean(context.vars.expect_routes_complex_logic_to_skill_module)],
    // adding-scenario specific (continued)
    ['warns_guide_backed_before_appending', parseExpectedBoolean(context.vars.expect_warns_guide_backed_before_appending)],
    // extending-step-vocabulary specific (continued)
    ['refuses_near_duplicate_pattern', parseExpectedBoolean(context.vars.expect_refuses_near_duplicate_pattern)],
    ['asks_before_narrow_pattern', parseExpectedBoolean(context.vars.expect_asks_before_narrow_pattern)],
    // regenerating-from-guide specific (continued)
    ['redirects_append_to_adding_scenario', parseExpectedBoolean(context.vars.expect_redirects_append_to_adding_scenario)],
    ['missing_step_blocks_bdd_loop', parseExpectedBoolean(context.vars.expect_missing_step_blocks_bdd_loop)],
  ];

  const failures = [];
  let checkedCount = 0;

  for (const [key, expected] of checks) {
    if (expected === null) continue;
    checkedCount++;
    const actual = payload[key];
    if (typeof actual !== 'boolean') {
      failures.push(`Missing or non-boolean field "${key}" in JSON output (got: ${JSON.stringify(actual)})`);
    } else if (actual !== expected) {
      failures.push(`Expected "${key}" to be ${expected}, got ${actual}`);
    }
  }

  if (checkedCount === 0) {
    return {
      pass: false,
      score: 0,
      reason: 'No contract checks were specified in test vars (all expect_* vars missing)',
    };
  }

  if (failures.length > 0) {
    return {
      pass: false,
      score: Math.max(0, 1 - failures.length / checkedCount),
      reason: failures.join('; '),
    };
  }

  return {
    pass: true,
    score: 1,
    reason: `All ${checkedCount} contract checks passed`,
  };
};
