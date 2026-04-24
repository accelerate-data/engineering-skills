const { extractJsonObject, normalizeTerms } = require('./schema-helpers');
const checkRoutingContract = require('./check-routing-contract');

function parseExpectedBoolean(value) {
  if (value === undefined) return null;
  return String(value).trim().toLowerCase() === 'true';
}

function getPayloadValue(payload, field) {
  if (Object.prototype.hasOwnProperty.call(payload, field)) {
    return payload[field];
  }

  const aliases = {
    asks_to_record_project_in_agents_md_only_after_user_supplies_it: [
      'asks_toRecord_project_in_agents_md_only_after_user_supplies_it',
    ],
  };

  for (const alias of aliases[field] || []) {
    if (Object.prototype.hasOwnProperty.call(payload, alias)) {
      return payload[alias];
    }
  }

  const lowerField = field.toLowerCase();
  for (const key of Object.keys(payload)) {
    if (key.toLowerCase() === lowerField) {
      return payload[key];
    }
  }

  return undefined;
}

function normalizeResolvedField(value) {
  const normalized = String(value).trim().toLowerCase().replace(/[\s-]+/g, '_');
  const aliases = {
    user_flow: 'user_flow_label',
    user_flow_child_label: 'user_flow_label',
  };
  return aliases[normalized] || normalized;
}

module.exports = (output, context) => {
  if (context.vars.expected_detected_skill !== undefined) {
    return checkRoutingContract(output, context);
  }

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
    ['searches_codebase_first', parseExpectedBoolean(context.vars.expect_searches_codebase_first)],
    ['searches_codebase_before_asking_user', parseExpectedBoolean(context.vars.expect_searches_codebase_before_asking_user)],
    ['enters_plan_mode', parseExpectedBoolean(context.vars.expect_enters_plan_mode)],
    ['asks_question_now', parseExpectedBoolean(context.vars.expect_asks_question_now)],
    ['asks_question_immediately', parseExpectedBoolean(context.vars.expect_asks_question_immediately)],
    ['creates_pr', parseExpectedBoolean(context.vars.expect_creates_pr)],
    [
      'creates_pr_with_unproven_acceptance_criteria',
      parseExpectedBoolean(context.vars.expect_creates_pr_with_unproven_acceptance_criteria),
    ],
    ['creates_checkpoint_commits', parseExpectedBoolean(context.vars.expect_creates_checkpoint_commits)],
    ['creates_final_commit', parseExpectedBoolean(context.vars.expect_creates_final_commit)],
    ['edits_code_in_pr_phase', parseExpectedBoolean(context.vars.expect_edits_code_in_pr_phase)],
    ['creates_branch_and_worktree_first', parseExpectedBoolean(context.vars.expect_creates_branch_and_worktree_first)],
    ['stops_on_branch_or_worktree_failure', parseExpectedBoolean(context.vars.expect_stops_on_branch_or_worktree_failure)],
    ['requires_clean_worktree_for_handoff', parseExpectedBoolean(context.vars.expect_requires_clean_worktree_for_handoff)],
    ['stops_on_dirty_worktree', parseExpectedBoolean(context.vars.expect_stops_on_dirty_worktree)],
    ['auto_cleans_disposable_post_merge', parseExpectedBoolean(context.vars.expect_auto_cleans_disposable_post_merge)],
    ['stops_on_tracked_changes_during_cleanup', parseExpectedBoolean(context.vars.expect_stops_on_tracked_changes_during_cleanup)],
    ['runs_required_validation', parseExpectedBoolean(context.vars.expect_runs_required_validation)],
    ['runs_skill_evals', parseExpectedBoolean(context.vars.expect_runs_skill_evals)],
    [
      'checks_promptfoo_db_for_latest_passing_eval',
      parseExpectedBoolean(context.vars.expect_checks_promptfoo_db_for_latest_passing_eval),
    ],
    [
      'compares_eval_runs_to_content_relevant_changes',
      parseExpectedBoolean(context.vars.expect_compares_eval_runs_to_content_relevant_changes),
    ],
    ['avoids_full_eval_suite_by_default', parseExpectedBoolean(context.vars.expect_avoids_full_eval_suite_by_default)],
    ['runs_only_stale_targeted_evals', parseExpectedBoolean(context.vars.expect_runs_only_stale_targeted_evals)],
    [
      'falls_back_to_eval_when_db_evidence_missing',
      parseExpectedBoolean(context.vars.expect_falls_back_to_eval_when_db_evidence_missing),
    ],
    ['pushes_branch', parseExpectedBoolean(context.vars.expect_pushes_branch)],
    ['uses_independent_review_agents', parseExpectedBoolean(context.vars.expect_uses_independent_review_agents)],
    ['runs_code_review', parseExpectedBoolean(context.vars.expect_runs_code_review)],
    ['runs_simplification_review', parseExpectedBoolean(context.vars.expect_runs_simplification_review)],
    ['runs_test_coverage_review', parseExpectedBoolean(context.vars.expect_runs_test_coverage_review)],
    ['runs_acceptance_criteria_review', parseExpectedBoolean(context.vars.expect_runs_acceptance_criteria_review)],
    ['updates_linear_with_ac_status', parseExpectedBoolean(context.vars.expect_updates_linear_with_ac_status)],
    [
      'posts_linear_note_with_tests_and_next_steps',
      parseExpectedBoolean(context.vars.expect_posts_linear_note_with_tests_and_next_steps),
    ],
    [
      'stops_if_acceptance_criteria_incomplete',
      parseExpectedBoolean(context.vars.expect_stops_if_acceptance_criteria_incomplete),
    ],
    ['moves_issue_to_in_review', parseExpectedBoolean(context.vars.expect_moves_issue_to_in_review)],
    ['checks_off_acceptance_criteria', parseExpectedBoolean(context.vars.expect_checks_off_acceptance_criteria)],
    [
      'checks_off_only_proven_acceptance_criteria',
      parseExpectedBoolean(context.vars.expect_checks_off_only_proven_acceptance_criteria),
    ],
    [
      'hands_back_to_implementation_when_ac_requires_code',
      parseExpectedBoolean(context.vars.expect_hands_back_to_implementation_when_ac_requires_code),
    ],
    ['uses_generic_issue_linking_language', parseExpectedBoolean(context.vars.expect_uses_generic_issue_linking_language)],
    ['runs_design_conformance_gate', parseExpectedBoolean(context.vars.expect_runs_design_conformance_gate)],
    ['supports_local_design_references', parseExpectedBoolean(context.vars.expect_supports_local_design_references)],
    [
      'compares_design_to_implementation_evidence',
      parseExpectedBoolean(context.vars.expect_compares_design_to_implementation_evidence),
    ],
    ['records_design_conformance_evidence', parseExpectedBoolean(context.vars.expect_records_design_conformance_evidence)],
    ['blocks_pr_for_design_mismatch_in_this_scenario', parseExpectedBoolean(context.vars.expect_blocks_pr_for_design_mismatch_in_this_scenario)],
    ['stops_if_pr_not_merged', parseExpectedBoolean(context.vars.expect_stops_if_pr_not_merged)],
    ['would_close_issue_in_this_scenario', parseExpectedBoolean(context.vars.expect_would_close_issue_in_this_scenario)],
    ['would_do_cleanup_in_this_scenario', parseExpectedBoolean(context.vars.expect_would_do_cleanup_in_this_scenario)],
    ['merges_pr', parseExpectedBoolean(context.vars.expect_merges_pr)],
    ['closes_issue', parseExpectedBoolean(context.vars.expect_closes_issue)],
    ['does_cleanup', parseExpectedBoolean(context.vars.expect_does_cleanup)],
    [
      'team_requires_user_flow_label',
      parseExpectedBoolean(context.vars.expect_team_requires_user_flow_label),
    ],
    [
      'reads_user_flow_labels_live',
      parseExpectedBoolean(context.vars.expect_reads_user_flow_labels_live),
    ],
    [
      'proposes_user_flow_child_label',
      parseExpectedBoolean(context.vars.expect_proposes_user_flow_child_label),
    ],
    [
      'recommends_one_user_flow_label',
      parseExpectedBoolean(context.vars.expect_recommends_one_user_flow_label),
    ],
    [
      'lists_close_alternatives_in_confirmation',
      parseExpectedBoolean(context.vars.expect_lists_close_alternatives_in_confirmation),
    ],
    [
      'asks_user_to_pick_user_flow',
      parseExpectedBoolean(context.vars.expect_asks_user_to_pick_user_flow),
    ],
    [
      'user_flow_label_in_confirmation',
      parseExpectedBoolean(context.vars.expect_user_flow_label_in_confirmation),
    ],
    [
      'refuses_silent_missing_user_flow',
      parseExpectedBoolean(context.vars.expect_refuses_silent_missing_user_flow),
    ],
    ['ignores_past_milestones', parseExpectedBoolean(context.vars.expect_ignores_past_milestones)],
    ['asks_user_to_choose_milestone', parseExpectedBoolean(context.vars.expect_asks_user_to_choose_milestone)],
  ];

  for (const [field, expected] of checks) {
    if (expected === null) continue;
    const actual = getPayloadValue(payload, field);
    if (actual !== expected) {
      return {
        pass: false,
        score: 0,
        reason: `Expected ${field}=${expected}, got ${actual}`,
      };
    }
  }

  if (context.vars.expect_question_count !== undefined) {
    const expected = Number(context.vars.expect_question_count);
    if (payload.question_count !== expected) {
      return {
        pass: false,
        score: 0,
        reason: `Expected question_count=${expected}, got ${payload.question_count}`,
      };
    }
  }

  if (context.vars.expected_issue_kind !== undefined) {
    const expected = String(context.vars.expected_issue_kind).trim().toLowerCase();
    const actual = String(payload.issue_kind || '').trim().toLowerCase();
    if (actual !== expected) {
      return {
        pass: false,
        score: 0,
        reason: `Expected issue_kind=${expected}, got ${actual}`,
      };
    }
  }

  if (context.vars.expect_uses_distinct_issue_kind_paths !== undefined) {
    const expected = parseExpectedBoolean(context.vars.expect_uses_distinct_issue_kind_paths);
    if (payload.uses_distinct_issue_kind_paths !== expected) {
      return {
        pass: false,
        score: 0,
        reason: `Expected uses_distinct_issue_kind_paths=${expected}, got ${payload.uses_distinct_issue_kind_paths}`,
      };
    }
  }

  const expectedStringFields = [
    ['assignee_default', context.vars.expected_assignee_default],
    ['cycle_default', context.vars.expected_cycle_default],
  ];

  for (const [field, expectedRaw] of expectedStringFields) {
    if (expectedRaw === undefined) continue;
    const expected = String(expectedRaw).trim().toLowerCase();
    const actual = String(payload[field] || '').trim().toLowerCase();
    const aliases = {
      creator: ['creator', 'requester', 'issue-creator', 'issue_creator', 'issue creator', 'current_user', 'current user'],
      current: ['current', 'current_cycle', 'current cycle'],
    };
    const accepted = aliases[expected] || [expected];
    if (!accepted.includes(actual)) {
      return {
        pass: false,
        score: 0,
        reason: `Expected ${field}=${expected}, got ${actual}`,
      };
    }
  }

  if (context.vars.expected_milestone_strategy !== undefined) {
    const expected = String(context.vars.expected_milestone_strategy).trim().toLowerCase();
    const actual = String(payload.milestone_strategy || '').trim().toLowerCase();
    const aliases = {
      'future-only': ['future-only', 'future milestones only', 'user-selects-from-futures', 'future-options-only'],
    };
    const accepted = aliases[expected] || [expected];
    const acceptedByAlias = accepted.includes(actual);
    const acceptedByDescription =
      expected === 'future-only' &&
      actual.includes('future') &&
      (!actual.includes('past') || actual.includes('ignore past') || actual.includes('avoid past') || actual.includes('do not auto'));
    if (!acceptedByAlias && !acceptedByDescription) {
      return {
        pass: false,
        score: 0,
        reason: `Expected milestone_strategy=${expected}, got ${actual}`,
      };
    }
  }

  if (context.vars.expected_design_conformance_result !== undefined) {
    const expected = String(context.vars.expected_design_conformance_result).trim().toLowerCase();
    const actual = String(payload.design_conformance_result || '').trim().toLowerCase();
    if (actual !== expected) {
      return {
        pass: false,
        score: 0,
        reason: `Expected design_conformance_result=${expected}, got ${actual}`,
      };
    }
  }

  const expectedBooleanFields = [
    ['resolves_project_before_asking', parseExpectedBoolean(context.vars.expect_resolves_project_before_asking)],
    ['confirms_critical_fields_with_user', parseExpectedBoolean(context.vars.expect_confirms_critical_fields_with_user)],
    [
      'asks_to_record_project_in_agents_md_only_after_user_supplies_it',
      parseExpectedBoolean(context.vars.expect_asks_to_record_project_in_agents_md_only_after_user_supplies_it),
    ],
  ];

  for (const [field, expected] of expectedBooleanFields) {
    if (expected === null) continue;
    const actual = getPayloadValue(payload, field);
    if (actual !== expected) {
      return {
        pass: false,
        score: 0,
        reason: `Expected ${field}=${expected}, got ${actual}`,
      };
    }
  }

  const expectedResolvedFields = normalizeTerms(context.vars.expected_resolved_fields_include);
  const forbiddenResolvedFields = normalizeTerms(context.vars.forbidden_resolved_fields_include);
  if (expectedResolvedFields.length > 0 || forbiddenResolvedFields.length > 0) {
    const actual = Array.isArray(payload.resolved_fields_include)
      ? payload.resolved_fields_include.map(normalizeResolvedField)
      : [];
    if (expectedResolvedFields.length > 0) {
      const missing = expectedResolvedFields.filter((term) => !actual.includes(term));
      if (missing.length > 0) {
        return {
          pass: false,
          score: 0,
          reason: `Missing resolved_fields_include values: ${missing.join(', ')}`,
        };
      }
    }
    if (forbiddenResolvedFields.length > 0) {
      const present = forbiddenResolvedFields.filter((term) => actual.includes(term));
      if (present.length > 0) {
        return {
          pass: false,
          score: 0,
          reason: `Forbidden resolved_fields_include values present: ${present.join(', ')}`,
        };
      }
    }
  }

  const expectedDesignPaths = normalizeTerms(context.vars.expected_design_paths_include);
  const actualDesignPaths = Array.isArray(payload.checked_design_paths)
    ? payload.checked_design_paths.map((value) => String(value).trim().toLowerCase())
    : [];

  if (parseExpectedBoolean(context.vars.expected_design_paths_empty) === true) {
    if (!Array.isArray(payload.checked_design_paths)) {
      return {
        pass: false,
        score: 0,
        reason: `Expected checked_design_paths to be an empty array, got ${typeof payload.checked_design_paths}`,
      };
    }

    if (actualDesignPaths.length > 0) {
      return {
        pass: false,
        score: 0,
        reason: `Expected checked_design_paths to be empty, got ${actualDesignPaths.join(', ')}`,
      };
    }
  }

  if (expectedDesignPaths.length > 0) {
    const missing = expectedDesignPaths.filter((term) => !actualDesignPaths.includes(term));
    if (missing.length > 0) {
      return {
        pass: false,
        score: 0,
        reason: `Missing checked_design_paths values: ${missing.join(', ')}`,
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
    reason: 'Skill contract matched expected workflow',
  };
};
