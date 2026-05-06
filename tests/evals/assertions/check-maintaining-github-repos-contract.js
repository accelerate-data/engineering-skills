const { extractJsonObject, normalizeTerms } = require('./schema-helpers');

function parseExpectedBoolean(value) {
  if (value === undefined) return null;
  return String(value).trim().toLowerCase() === 'true';
}

function expectedFieldName(varName) {
  if (!varName.startsWith('expect_')) return null;
  return varName.slice('expect_'.length);
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

module.exports = (output, context) => {
  if (!hasStrictSingleLineJsonEnvelope(output)) {
    return {
      pass: false,
      score: 0,
      reason: 'Expected a single-line JSON object with no preamble or trailing text',
    };
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

  const requiredBooleanFields = [
    'is_prompt_driven_knowledge_skill',
    'rejects_fixed_workflow_contract',
    'uses_repo_level_signals',
    'uses_org_level_safety_signals',
    'reports_branch_count_and_merge_split',
    'reports_inactive_branch_threshold',
    'reports_pr_pending_threshold',
    'requires_preview_before_mutation',
    'requires_exact_scope_confirmation',
  ];

  if (!isNonEmptyString(payload.skill_path)) {
    return {
      pass: false,
      score: 0,
      reason: 'Expected skill_path to be a non-empty string',
    };
  }

  for (const field of requiredBooleanFields) {
    if (typeof payload[field] !== 'boolean') {
      return {
        pass: false,
        score: 0,
        reason: `Expected ${field} to be boolean, got ${typeof payload[field]}`,
      };
    }
  }

  if (!Array.isArray(payload.prompt_obligations) || payload.prompt_obligations.length === 0) {
    return {
      pass: false,
      score: 0,
      reason: 'Expected prompt_obligations to be a non-empty array',
    };
  }

  if (!payload.prompt_obligations.every(isNonEmptyString)) {
    return {
      pass: false,
      score: 0,
      reason: 'Expected every prompt_obligation to be a non-empty string',
    };
  }

  if (!isNonEmptyString(payload.notes)) {
    return {
      pass: false,
      score: 0,
      reason: 'Expected notes to be a non-empty string',
    };
  }

  for (const [varName, varValue] of Object.entries(context.vars || {})) {
    const field = expectedFieldName(varName);
    if (!field) continue;

    const expected = parseExpectedBoolean(varValue);
    if (expected === null) continue;

    if (payload[field] !== expected) {
      return {
        pass: false,
        score: 0,
        reason: `Expected ${field}=${expected}, got ${payload[field]}`,
      };
    }
  }

  if (context.vars.expected_skill_path !== undefined) {
    const expected = normalizeSkillPath(context.vars.expected_skill_path);
    const actual = normalizeSkillPath(payload.skill_path);
    if (!actual.includes(expected)) {
      return {
        pass: false,
        score: 0,
        reason: `Expected skill_path to include ${expected}, got ${actual}`,
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

  return {
    pass: true,
    score: 1,
    reason: 'maintaining-github-repos knowledge-skill contract matched expected behavior',
  };
};
