const fs = require('fs');
const path = require('path');

const evalRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(evalRoot, '..', '..');
const skillsRoot = path.join(repoRoot, 'skills');
const packagesRoot = path.join(evalRoot, 'packages');
const baselinePath = path.join(evalRoot, 'skill-eval-coverage-baseline.json');

function listDirectories(root) {
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function readBaseline() {
  const parsed = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  return [...(parsed.uncovered_skills || [])].sort();
}

function formatList(items) {
  return items.length === 0 ? '(none)' : items.map((item) => `- ${item}`).join('\n');
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function listYamlFiles(root) {
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(ya?ml|json)$/.test(entry.name))
    .map((entry) => path.join(root, entry.name))
    .sort();
}

function normalizeFailureModes(value) {
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => normalizeFailureModes(item));
  }

  return [];
}

function parseConfig(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');

  if (filePath.endsWith('.json')) {
    return JSON.parse(text);
  }

  // Keep JSON-only worktrees dependency-free while still supporting YAML when
  // the eval suite chooses to use it.
  // eslint-disable-next-line global-require, import/no-dynamic-require
  const YAML = require('yaml');
  return YAML.parse(text);
}

function readEvalMetadata(filePath) {
  const config = parseConfig(filePath);
  const defaultVars = isObject(config?.defaultTest?.vars) ? config.defaultTest.vars : {};
  const tests = Array.isArray(config?.tests) ? config.tests : [];

  return tests.map((testConfig) => {
    const testVars = isObject(testConfig?.vars) ? testConfig.vars : {};
    const vars = { ...defaultVars, ...testVars };

    return {
      evalType: vars.eval_type,
      failureModes: normalizeFailureModes(vars.failure_modes),
    };
  });
}

function summarizeEvalPackage(packageName) {
  const packageDir = path.join(packagesRoot, packageName);
  const summary = {
    packageName,
    userBehavior: 0,
    contractOracle: 0,
    failureModes: new Set(),
  };

  for (const filePath of listYamlFiles(packageDir)) {
    const cases = readEvalMetadata(filePath);

    for (const testCase of cases) {
      if (testCase.evalType === 'user-behavior') {
        summary.userBehavior += 1;
      }

      if (testCase.evalType === 'contract-oracle') {
        summary.contractOracle += 1;
      }

      for (const failureMode of testCase.failureModes) {
        summary.failureModes.add(failureMode);
      }
    }
  }

  return {
    ...summary,
    failureModes: [...summary.failureModes].sort(),
  };
}

function formatMetadataSummary(packageSummaries) {
  if (packageSummaries.length === 0) {
    return '(none)';
  }

  return packageSummaries
    .map((summary) => {
      const failureModes = summary.failureModes.length === 0 ? '(none)' : summary.failureModes.join(', ');
      return `- ${summary.packageName}: user-behavior ${summary.userBehavior}, contract-oracle ${summary.contractOracle}, failure modes ${failureModes}`;
    })
    .join('\n');
}

function skillHasEvalPackage(skill, evalPackages) {
  if (evalPackages.has(skill)) {
    return true;
  }

  const prefix = `${skill.replace(/-issue$/, '')}-`;
  return [...evalPackages].some((packageName) => packageName.startsWith(prefix));
}

function main() {
  const skills = listDirectories(skillsRoot).filter((skill) => {
    return fs.existsSync(path.join(skillsRoot, skill, 'SKILL.md'));
  });
  const evalPackages = new Set(listDirectories(packagesRoot));
  const uncovered = skills.filter((skill) => !skillHasEvalPackage(skill, evalPackages));
  const expectedUncovered = readBaseline();

  const unexpectedUncovered = uncovered.filter((skill) => !expectedUncovered.includes(skill));
  const staleBaseline = expectedUncovered.filter((skill) => !uncovered.includes(skill));

  console.log(`Skill eval coverage: ${skills.length - uncovered.length}/${skills.length} skills have eval packages.`);
  console.log('Uncovered skills:');
  console.log(formatList(uncovered));
  console.log('\nEval metadata summary:');
  console.log(formatMetadataSummary([...evalPackages].sort().map((packageName) => summarizeEvalPackage(packageName))));

  if (unexpectedUncovered.length > 0 || staleBaseline.length > 0) {
    console.error('\nSkill eval coverage baseline mismatch.');
    if (unexpectedUncovered.length > 0) {
      console.error('\nUnexpected uncovered skills:');
      console.error(formatList(unexpectedUncovered));
    }
    if (staleBaseline.length > 0) {
      console.error('\nBaseline entries that now have eval packages or no longer exist:');
      console.error(formatList(staleBaseline));
    }
    console.error(`\nUpdate ${path.relative(repoRoot, baselinePath)} when eval coverage changes.`);
    process.exit(1);
  }
}

main();
