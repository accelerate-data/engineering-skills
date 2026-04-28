const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');

const LINEAR_ADJACENT_SKILLS = new Set([
  'creating-feature-request',
  'creating-linear-issue',
  'implementing-linear-issue',
  'raising-linear-pr',
  'closing-linear-issue',
  'yolo',
]);

function listFiles(root, predicate) {
  if (!fs.existsSync(root)) {
    return [];
  }

  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(root, entry.name);

    if (entry.isDirectory()) {
      return listFiles(fullPath, predicate);
    }

    return entry.isFile() && predicate(fullPath) ? [fullPath] : [];
  });
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function skillNameFromPrompt(promptPath) {
  return path.basename(promptPath, '.txt').replace(/^skill-/, '');
}

function forbidsLinearAction(text, actionPattern) {
  return new RegExp(`do not[^.\\n]*(?:${actionPattern})`, 'i').test(text);
}

function statesLinearFactsAreFixtureSupplied(text) {
  return text.split(/[.\n]/).some((sentence) => {
    return (
      /\brequired\s+linear\s+facts\b/i.test(sentence) &&
      /\b(?:scenario|simulated\s+context)\b/i.test(sentence) &&
      /\b(?:(?:are\s+)?(?:supplied|provided|present)|comes?\s+from)\b/i.test(sentence) &&
      !/\b(?:not|never)\s+(?:supplied|provided|present|comes?\s+from|come\s+from)\b/i.test(sentence) &&
      !/\b(?:do|does|are)\s+not\s+come\s+from\b/i.test(sentence)
    );
  });
}

function checkLinearPrompt(relativePath, text, errors) {
  if (!forbidsLinearAction(text, '(read|query|access|contact|call)\\s+linear|linear\\s+(reads|queries|access)')) {
    errors.push(`${relativePath} must forbid reading Linear.`);
  }

  if (!forbidsLinearAction(text, '(write|create|update|modify|mutate)\\s+linear|linear\\s+(writes|mutations)')) {
    errors.push(`${relativePath} must forbid writing Linear.`);
  }

  if (!statesLinearFactsAreFixtureSupplied(text)) {
    errors.push(
      `${relativePath} must state required Linear facts are supplied by the scenario or simulated context.`,
    );
  }
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasFailureModes(value) {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.some((item) => {
      if (typeof item === 'string') {
        return item.trim().length > 0;
      }

      return item !== null && item !== undefined;
    });
  }

  return false;
}

function checkFixtureMetadata(relativePath, text, errors) {
  let config;
  try {
    config = YAML.parse(text);
  } catch (error) {
    errors.push(`${relativePath} could not be parsed as YAML: ${error.message}`);
    return;
  }

  const defaultVars = isObject(config?.defaultTest?.vars) ? config.defaultTest.vars : {};
  const tests = Array.isArray(config?.tests) ? config.tests : [];

  tests.forEach((testConfig) => {
    const testVars = isObject(testConfig?.vars) ? testConfig.vars : {};
    const effectiveVars = { ...defaultVars, ...testVars };

    if (effectiveVars.eval_type === 'user-behavior' && !hasFailureModes(effectiveVars.failure_modes)) {
      errors.push(`${relativePath} user-behavior tests must declare failure_modes.`);
    }
  });
}

function checkEvalUserBehavior(repoRoot = path.resolve(__dirname, '..', '..', '..')) {
  const evalRoot = path.join(repoRoot, 'tests', 'evals');
  const errors = [];

  const promptFiles = listFiles(path.join(evalRoot, 'prompts'), (filePath) => {
    return path.extname(filePath) === '.txt';
  });

  for (const promptPath of promptFiles) {
    const skillName = skillNameFromPrompt(promptPath);
    if (!LINEAR_ADJACENT_SKILLS.has(skillName)) {
      continue;
    }

    checkLinearPrompt(path.relative(repoRoot, promptPath), readText(promptPath), errors);
  }

  const packageFiles = listFiles(path.join(evalRoot, 'packages'), (filePath) => {
    return /\.ya?ml$/.test(filePath);
  });

  for (const packagePath of packageFiles) {
    checkFixtureMetadata(path.relative(repoRoot, packagePath), readText(packagePath), errors);
  }

  return { ok: errors.length === 0, errors };
}

function main() {
  const repoRoot = process.argv[2] ? path.resolve(process.argv[2]) : undefined;
  const result = checkEvalUserBehavior(repoRoot);

  if (!result.ok) {
    console.error(result.errors.join('\n'));
    process.exit(1);
  }

  console.log('Eval user-behavior checks passed.');
}

if (require.main === module) {
  main();
}

module.exports = { checkEvalUserBehavior };
