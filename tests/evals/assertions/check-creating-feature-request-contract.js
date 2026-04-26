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
    ['queries_linear_labels', parseExpectedBoolean(context.vars.expect_queries_linear_labels)],
    ['queries_linear_projects', parseExpectedBoolean(context.vars.expect_queries_linear_projects)],
    ['queries_ro_statuses', parseExpectedBoolean(context.vars.expect_queries_ro_statuses)],
    ['uses_live_metadata_before_defaults', parseExpectedBoolean(context.vars.expect_uses_live_metadata_before_defaults)],
    [
      'resolves_user_flow_child_labels_live',
      parseExpectedBoolean(context.vars.expect_resolves_user_flow_child_labels_live),
    ],
    ['requires_user_flow_tag', parseExpectedBoolean(context.vars.expect_requires_user_flow_tag)],
    ['proposes_one_user_flow_label', parseExpectedBoolean(context.vars.expect_proposes_one_user_flow_label)],
    [
      'lists_close_user_flow_alternatives',
      parseExpectedBoolean(context.vars.expect_lists_close_user_flow_alternatives),
    ],
    ['asks_user_to_pick_user_flow', parseExpectedBoolean(context.vars.expect_asks_user_to_pick_user_flow)],
    ['creates_issue_without_user_flow', parseExpectedBoolean(context.vars.expect_creates_issue_without_user_flow)],
    ['shows_preview_before_confirmation', parseExpectedBoolean(context.vars.expect_shows_preview_before_confirmation)],
    [
      'requires_user_confirmation_before_create',
      parseExpectedBoolean(context.vars.expect_requires_user_confirmation_before_create),
    ],
    ['creates_issue_before_confirmation', parseExpectedBoolean(context.vars.expect_creates_issue_before_confirmation)],
    ['uses_yaml_payload', parseExpectedBoolean(context.vars.expect_uses_yaml_payload)],
    ['uses_linear_native_create', parseExpectedBoolean(context.vars.expect_uses_linear_native_create)],
    [
      'falls_back_to_hardcoded_linear_metadata',
      parseExpectedBoolean(context.vars.expect_falls_back_to_hardcoded_linear_metadata),
    ],
    ['stops_when_linear_metadata_missing', parseExpectedBoolean(context.vars.expect_stops_when_linear_metadata_missing)],
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
    reason: 'Creating-feature-request skill contract matched expected workflow',
  };
};
