const { extractJsonObject, normalizeTerms } = require('./schema-helpers');

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
    return {
      pass: false,
      score: 0,
      reason: `Failed to parse JSON output: ${error.message}`,
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
    reason: 'code-simplifier skill contract matched expected workflow',
  };
};
