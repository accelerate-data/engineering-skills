const { extractJsonObject, normalizeTerms } = require('./schema-helpers');

// Only `path` is an enum string field; every other expect_* var is boolean.
const STRING_FIELDS = new Set(['path']);

function expectedFieldName(varName) {
  if (!varName.startsWith('expect_')) return null;
  return varName.slice('expect_'.length);
}

function normalize(value) {
  return String(value).trim().toLowerCase();
}

module.exports = (output, context) => {
  let payload;
  try {
    payload = extractJsonObject(output);
  } catch (error) {
    return { pass: false, score: 0, reason: `Failed to parse JSON output: ${error.message}` };
  }

  for (const [varName, varValue] of Object.entries(context.vars || {})) {
    const field = expectedFieldName(varName);
    if (!field) continue;

    if (STRING_FIELDS.has(field)) {
      const expected = normalize(varValue);
      const actual = normalize(payload[field] ?? '');
      if (actual !== expected) {
        return { pass: false, score: 0, reason: `Expected ${field}=${expected}, got ${actual || '(missing)'}` };
      }
      continue;
    }

    const expectedRaw = normalize(varValue);
    if (expectedRaw !== 'true' && expectedRaw !== 'false') continue;
    const expected = expectedRaw === 'true';
    if (payload[field] !== expected) {
      return { pass: false, score: 0, reason: `Expected ${field}=${expected}, got ${payload[field]}` };
    }
  }

  const requiredTerms = normalizeTerms(context.vars.required_terms);
  if (requiredTerms.length > 0) {
    const haystack = JSON.stringify(payload).toLowerCase();
    const missing = requiredTerms.filter((term) => !haystack.includes(term));
    if (missing.length > 0) {
      return { pass: false, score: 0, reason: `Missing required terms: ${missing.join(', ')}` };
    }
  }

  return { pass: true, score: 1, reason: 'Contract satisfied' };
};
