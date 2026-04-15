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
    return { pass: false, score: 0, reason: `Failed to parse JSON output: ${error.message}` };
  }

  if (context.vars.expected_detected_skill !== undefined) {
    const expected = String(context.vars.expected_detected_skill).trim().toLowerCase();
    const actual = String(payload.detected_skill || '').trim().toLowerCase();
    if (actual !== expected) {
      return {
        pass: false,
        score: 0,
        reason: `Expected detected_skill=${expected}, got ${actual}`,
      };
    }
  }

  const boolChecks = [
    ['trigger_found_in_message', parseExpectedBoolean(context.vars.expect_trigger_found_in_message)],
    ['would_pause_current_flow', parseExpectedBoolean(context.vars.expect_would_pause_current_flow)],
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

  return { pass: true, score: 1, reason: 'Routing contract matched expected behavior' };
};
