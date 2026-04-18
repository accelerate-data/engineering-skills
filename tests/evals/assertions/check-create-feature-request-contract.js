const { extractJsonObject, normalizeTerms } = require('./schema-helpers');

function parseExpectedBoolean(value) {
  if (value === undefined) return null;
  return String(value).trim().toLowerCase() === 'true';
}

function normalizedString(value) {
  return String(value || '').trim().toLowerCase();
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
    ['loads_vibedata_strategy', parseExpectedBoolean(context.vars.expect_loads_vibedata_strategy)],
    ['loads_vibedata_architecture', parseExpectedBoolean(context.vars.expect_loads_vibedata_architecture)],
    ['queries_linear_labels', parseExpectedBoolean(context.vars.expect_queries_linear_labels)],
    ['queries_linear_projects', parseExpectedBoolean(context.vars.expect_queries_linear_projects)],
    ['queries_ro_statuses', parseExpectedBoolean(context.vars.expect_queries_ro_statuses)],
    ['uses_live_metadata_before_defaults', parseExpectedBoolean(context.vars.expect_uses_live_metadata_before_defaults)],
    ['shows_preview_before_confirmation', parseExpectedBoolean(context.vars.expect_shows_preview_before_confirmation)],
    [
      'requires_user_confirmation_before_create',
      parseExpectedBoolean(context.vars.expect_requires_user_confirmation_before_create),
    ],
    ['creates_issue_before_confirmation', parseExpectedBoolean(context.vars.expect_creates_issue_before_confirmation)],
    [
      'handles_context_load_failure_by_warning_and_continue',
      parseExpectedBoolean(context.vars.expect_handles_context_load_failure_by_warning_and_continue),
    ],
    [
      'handles_linear_metadata_failure_by_defaults',
      parseExpectedBoolean(context.vars.expect_handles_linear_metadata_failure_by_defaults),
    ],
    ['emits_context_load_warning', parseExpectedBoolean(context.vars.expect_emits_context_load_warning)],
    ['continues_without_context_enrichment', parseExpectedBoolean(context.vars.expect_continues_without_context_enrichment)],
    ['omits_context_enrichment_fields', parseExpectedBoolean(context.vars.expect_omits_context_enrichment_fields)],
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

  const stringChecks = [
    ['team', context.vars.expected_team],
    ['default_priority', context.vars.expected_default_priority],
    ['default_estimate', context.vars.expected_default_estimate],
  ];

  for (const [field, expectedRaw] of stringChecks) {
    if (expectedRaw === undefined) continue;
    const expected = normalizedString(expectedRaw);
    const actual = normalizedString(payload[field]);
    if (actual !== expected) {
      return {
        pass: false,
        score: 0,
        reason: `Expected ${field}=${expected}, got ${actual}`,
      };
    }
  }

  const expectedSections = normalizeTerms(context.vars.required_description_sections);
  if (expectedSections.length > 0) {
    const actualSections = Array.isArray(payload.description_sections_include)
      ? payload.description_sections_include.map(normalizedString)
      : [];
    const missing = expectedSections.filter((section) => !actualSections.includes(section));
    if (missing.length > 0) {
      return {
        pass: false,
        score: 0,
        reason: `Missing description_sections_include values: ${missing.join(', ')}`,
      };
    }
  }

  return {
    pass: true,
    score: 1,
    reason: 'Create-feature-request skill contract matched expected workflow',
  };
};
