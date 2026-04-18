const fs = require('fs');
const path = require('path');

const evalRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(evalRoot, '..', '..');
const manifestPath = path.join(repoRoot, '.codex-plugin', 'plugin.json');

const forbiddenPatterns = [
  {
    pattern: /\bmcp__claude_ai_[A-Za-z0-9_]+/g,
    reason: 'Claude-specific MCP tool name in a Codex-exposed skill',
  },
  {
    pattern: /\bAskUserQuestion\b/g,
    reason: 'Claude-specific user-question tool in a Codex-exposed skill',
  },
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function walkFiles(root) {
  const entries = fs.readdirSync(root, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function lineNumberForIndex(text, index) {
  return text.slice(0, index).split('\n').length;
}

function main() {
  const manifest = readJson(manifestPath);
  const skillsDir = path.resolve(repoRoot, manifest.skills || './skills');
  const files = walkFiles(skillsDir).filter((filePath) => {
    return ['.md', '.yaml', '.yml', '.json'].includes(path.extname(filePath));
  });

  const findings = [];

  for (const filePath of files) {
    const relativePath = path.relative(repoRoot, filePath);
    const text = fs.readFileSync(filePath, 'utf8');

    for (const { pattern, reason } of forbiddenPatterns) {
      for (const match of text.matchAll(pattern)) {
        findings.push(`${relativePath}:${lineNumberForIndex(text, match.index)} ${reason}: ${match[0]}`);
      }
    }
  }

  if (findings.length > 0) {
    console.error('Codex compatibility check failed:');
    for (const finding of findings) {
      console.error(`- ${finding}`);
    }
    process.exit(1);
  }

  console.log(`Codex compatibility check passed for ${files.length} files.`);
}

main();
