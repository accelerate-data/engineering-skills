const fs = require('node:fs');
const path = require('node:path');

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

function splitYamlTestBlocks(text) {
  const lines = text.split(/\r?\n/);
  const blocks = [];
  let current = [];

  for (const line of lines) {
    if (/^\s*-\s+description\s*:/.test(line)) {
      if (current.length > 0) {
        blocks.push(current.join('\n'));
      }
      current = [line];
      continue;
    }

    if (current.length > 0) {
      current.push(line);
    }
  }

  if (current.length > 0) {
    blocks.push(current.join('\n'));
  }

  return blocks;
}

function hasUserBehaviorEvalType(text) {
  return /^\s*eval_type\s*:\s*['"]?user-behavior['"]?\s*$/m.test(text);
}

function hasFailureModes(text) {
  return /^\s*failure_modes\s*:\s*\S+/m.test(text);
}

function checkFixtureMetadata(relativePath, text, errors) {
  for (const block of splitYamlTestBlocks(text)) {
    if (hasUserBehaviorEvalType(block) && !hasFailureModes(block)) {
      errors.push(`${relativePath} user-behavior tests must declare failure_modes.`);
    }
  }
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
