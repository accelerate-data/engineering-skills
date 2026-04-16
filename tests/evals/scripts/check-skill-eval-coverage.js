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

function main() {
  const skills = listDirectories(skillsRoot).filter((skill) => {
    return fs.existsSync(path.join(skillsRoot, skill, 'SKILL.md'));
  });
  const evalPackages = new Set(listDirectories(packagesRoot));
  const uncovered = skills.filter((skill) => !evalPackages.has(skill));
  const expectedUncovered = readBaseline();

  const unexpectedUncovered = uncovered.filter((skill) => !expectedUncovered.includes(skill));
  const staleBaseline = expectedUncovered.filter((skill) => !uncovered.includes(skill));

  console.log(`Skill eval coverage: ${skills.length - uncovered.length}/${skills.length} skills have eval packages.`);
  console.log('Uncovered skills:');
  console.log(formatList(uncovered));

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
