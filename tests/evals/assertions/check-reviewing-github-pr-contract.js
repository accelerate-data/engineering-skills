function asBoolean(value, fieldName) {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw new Error(`Expected ${fieldName} to be the string "true" or "false".`);
}

function parseJsonObject(output) {
  if (typeof output !== 'string') {
    throw new Error(`Expected string output but received ${typeof output}.`);
  }

  try {
    return JSON.parse(output);
  } catch (error) {
    throw new Error(`Output must be valid JSON: ${error.message}`);
  }
}

function expectEqual(actual, expected, fieldName) {
  if (actual !== expected) {
    throw new Error(`Expected ${fieldName}=${JSON.stringify(expected)} but received ${JSON.stringify(actual)}.`);
  }
}

function expectRequiredTerms(output, requiredTerms) {
  if (!requiredTerms) {
    return;
  }

  const haystack = output.toLowerCase();
  const missingTerms = requiredTerms
    .split(',')
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean)
    .filter((term) => !haystack.includes(term));

  if (missingTerms.length > 0) {
    throw new Error(`Missing required terms: ${missingTerms.join(', ')}.`);
  }
}

module.exports = async function checkReviewingGithubPrContract(output, context) {
  const result = parseJsonObject(output);
  const vars = context?.vars ?? {};

  expectEqual(result.routes_from_pr_trigger, asBoolean(vars.expect_routes_from_pr_trigger, 'expect_routes_from_pr_trigger'), 'routes_from_pr_trigger');
  expectEqual(
    result.uses_pr_body_and_code_for_pr_claim,
    asBoolean(vars.expect_uses_pr_body_and_code_for_pr_claim, 'expect_uses_pr_body_and_code_for_pr_claim'),
    'uses_pr_body_and_code_for_pr_claim',
  );
  expectEqual(
    result.uses_linear_and_docs_for_required_scope,
    asBoolean(vars.expect_uses_linear_and_docs_for_required_scope, 'expect_uses_linear_and_docs_for_required_scope'),
    'uses_linear_and_docs_for_required_scope',
  );
  expectEqual(
    result.uses_changed_files_and_tests_for_implemented_scope,
    asBoolean(
      vars.expect_uses_changed_files_and_tests_for_implemented_scope,
      'expect_uses_changed_files_and_tests_for_implemented_scope',
    ),
    'uses_changed_files_and_tests_for_implemented_scope',
  );
  expectEqual(
    result.asks_spec_mapping_once_when_uncertain,
    asBoolean(vars.expect_asks_spec_mapping_once_when_uncertain, 'expect_asks_spec_mapping_once_when_uncertain'),
    'asks_spec_mapping_once_when_uncertain',
  );
  expectEqual(result.question_count, Number(vars.expect_question_count), 'question_count');

  if ('expect_blocks_approval_for_unproven_acs' in vars) {
    expectEqual(
      result.blocks_approval_for_unproven_acs,
      asBoolean(vars.expect_blocks_approval_for_unproven_acs, 'expect_blocks_approval_for_unproven_acs'),
      'blocks_approval_for_unproven_acs',
    );
  }

  if ('expect_checks_off_only_proven_criteria' in vars) {
    expectEqual(
      result.checks_off_only_proven_criteria,
      asBoolean(vars.expect_checks_off_only_proven_criteria, 'expect_checks_off_only_proven_criteria'),
      'checks_off_only_proven_criteria',
    );
  }

  expectEqual(result.proposed_review_event, vars.expected_proposed_review_event, 'proposed_review_event');
  expectEqual(
    result.requires_explicit_user_approval_before_posting,
    asBoolean(
      vars.expect_requires_explicit_user_approval_before_posting,
      'expect_requires_explicit_user_approval_before_posting',
    ),
    'requires_explicit_user_approval_before_posting',
  );
  expectEqual(
    result.posts_review_event_in_this_scenario,
    asBoolean(vars.expect_posts_review_event_in_this_scenario, 'expect_posts_review_event_in_this_scenario'),
    'posts_review_event_in_this_scenario',
  );
  expectEqual(
    result.recommends_close_for_badly_misscoped_pr,
    asBoolean(
      vars.expect_recommends_close_for_badly_misscoped_pr,
      'expect_recommends_close_for_badly_misscoped_pr',
    ),
    'recommends_close_for_badly_misscoped_pr',
  );
  expectEqual(
    result.would_cleanup_review_worktree_in_this_scenario,
    asBoolean(
      vars.expect_would_cleanup_review_worktree_in_this_scenario,
      'expect_would_cleanup_review_worktree_in_this_scenario',
    ),
    'would_cleanup_review_worktree_in_this_scenario',
  );

  if (typeof result.notes !== 'string' || result.notes.trim().length === 0) {
    throw new Error('Expected notes to be a non-empty string.');
  }

  expectRequiredTerms(output, vars.required_terms);

  return {
    pass: true,
    score: 1,
    reason: 'reviewing-github-pr contract matched expected scenario behavior',
  };
};
