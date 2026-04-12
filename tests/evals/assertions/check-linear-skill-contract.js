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
    ['searches_codebase_first', parseExpectedBoolean(context.vars.expect_searches_codebase_first)],
    ['searches_codebase_before_asking_user', parseExpectedBoolean(context.vars.expect_searches_codebase_before_asking_user)],
    ['enters_plan_mode', parseExpectedBoolean(context.vars.expect_enters_plan_mode)],
    ['asks_question_now', parseExpectedBoolean(context.vars.expect_asks_question_now)],
    ['asks_question_immediately', parseExpectedBoolean(context.vars.expect_asks_question_immediately)],
    ['creates_pr', parseExpectedBoolean(context.vars.expect_creates_pr)],
    ['creates_checkpoint_commits', parseExpectedBoolean(context.vars.expect_creates_checkpoint_commits)],
    ['creates_final_commit', parseExpectedBoolean(context.vars.expect_creates_final_commit)],
    ['creates_branch_and_worktree_first', parseExpectedBoolean(context.vars.expect_creates_branch_and_worktree_first)],
    ['stops_on_branch_or_worktree_failure', parseExpectedBoolean(context.vars.expect_stops_on_branch_or_worktree_failure)],
    ['requires_clean_worktree_for_handoff', parseExpectedBoolean(context.vars.expect_requires_clean_worktree_for_handoff)],
    ['stops_on_dirty_worktree', parseExpectedBoolean(context.vars.expect_stops_on_dirty_worktree)],
    ['runs_required_validation', parseExpectedBoolean(context.vars.expect_runs_required_validation)],
    ['runs_skill_evals', parseExpectedBoolean(context.vars.expect_runs_skill_evals)],
    ['moves_issue_to_in_review', parseExpectedBoolean(context.vars.expect_moves_issue_to_in_review)],
    ['checks_off_acceptance_criteria', parseExpectedBoolean(context.vars.expect_checks_off_acceptance_criteria)],
    ['merges_pr', parseExpectedBoolean(context.vars.expect_merges_pr)],
    ['closes_issue', parseExpectedBoolean(context.vars.expect_closes_issue)],
    ['does_cleanup', parseExpectedBoolean(context.vars.expect_does_cleanup)],
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

  if (context.vars.expect_has_distinct_paths !== undefined) {
    const expected = parseExpectedBoolean(context.vars.expect_has_distinct_paths);
    if (payload.has_distinct_paths !== expected) {
      return {
        pass: false,
        score: 0,
        reason: `Expected has_distinct_paths=${expected}, got ${payload.has_distinct_paths}`,
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
