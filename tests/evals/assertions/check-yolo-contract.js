const { extractJsonObject } = require('./schema-helpers');

module.exports = (output) => {
  let payload;
  try {
    payload = extractJsonObject(output);
  } catch (error) {
    return { pass: false, score: 0, reason: `Failed to parse JSON output: ${error.message}` };
  }

  const required = [
    'runs_creating_linear_issue_first',
    'runs_implementing_linear_issue_second',
    'runs_raising_linear_pr_third',
    'stops_after_pr_raised',
    'does_not_merge_or_close',
    'preserves_quality_gates_from_implementing',
    'surfaces_recovery_instruction_on_phase2_failure',
    'surfaces_recovery_instruction_on_phase3_failure',
  ];

  for (const field of required) {
    if (payload[field] !== true) {
      return {
        pass: false,
        score: 0,
        reason: `Expected ${field}=true, got ${payload[field]}`,
      };
    }
  }

  return { pass: true, score: 1, reason: 'Yolo skill contract matched expected behavior' };
};
