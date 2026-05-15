const { extractJsonObject } = require('./schema-helpers');

function parseExpectedBoolean(value) {
  if (value === undefined) return null;
  return String(value).trim().toLowerCase() === 'true';
}

function expectedFieldName(varName) {
  if (!varName.startsWith('expect_')) return null;
  return varName.slice('expect_'.length);
}

module.exports = (output, context) => {
  let payload;
  try {
    payload = extractJsonObject(output);
  } catch (error) {
    return { pass: false, score: 0, reason: `Failed to parse JSON output: ${error.message}` };
  }

  const vars = context.vars || {};

  if (vars.expected_issue_kind !== undefined) {
    const expected = String(vars.expected_issue_kind).trim().toLowerCase();
    const actual = String(payload.issue_kind || '').trim().toLowerCase();
    if (actual !== expected) {
      return {
        pass: false,
        score: 0,
        reason: `Expected issue_kind=${expected}, got ${actual}`,
      };
    }
  }

  if (vars.expected_team_name !== undefined) {
    const expected = String(vars.expected_team_name).trim();
    const actual = String(payload.team_name || '').trim();
    if (actual !== expected) {
      return {
        pass: false,
        score: 0,
        reason: `Expected team_name=${expected}, got ${actual}`,
      };
    }
  }

  if (vars.expected_resolved_owner_email !== undefined) {
    const expected = String(vars.expected_resolved_owner_email).trim().toLowerCase();
    const actual = String(payload.resolved_owner_email || '').trim().toLowerCase();
    if (actual !== expected) {
      return {
        pass: false,
        score: 0,
        reason: `Expected resolved_owner_email=${expected}, got ${actual}`,
      };
    }
  }

  if (vars.expected_detected_skill !== undefined) {
    const expected = String(vars.expected_detected_skill).trim().toLowerCase();
    const actual = String(payload.detected_skill || '').trim().toLowerCase();
    if (actual !== expected) {
      return {
        pass: false,
        score: 0,
        reason: `Expected detected_skill=${expected}, got ${actual}`,
      };
    }
  }

  for (const [varName, varValue] of Object.entries(vars)) {
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

  return { pass: true, score: 1, reason: 'creating-product-issues contract matched expected behavior' };
};
