const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const SKILL_DIR = path.join(REPO_ROOT, 'skills', 'reviewing-github-pr');
const SKILL_MD = path.join(SKILL_DIR, 'SKILL.md');
const PR_RESOLUTION_MD = path.join(SKILL_DIR, 'references', 'pr-resolution.md');
const CONTEXT_GATHERING_MD = path.join(SKILL_DIR, 'references', 'context-gathering.md');
const AC_VERIFICATION_MD = path.join(SKILL_DIR, 'references', 'ac-verification.md');
const REVIEW_DECISION_MD = path.join(SKILL_DIR, 'references', 'review-decision.md');
const GITHUB_REVIEW_POSTING_MD = path.join(SKILL_DIR, 'references', 'github-review-posting.md');
const WORKTREE_CLEANUP_MD = path.join(SKILL_DIR, 'references', 'worktree-cleanup.md');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

test('reviewing-github-pr SKILL.md exists', () => {
  assert.ok(fs.existsSync(SKILL_MD), `Expected ${SKILL_MD} to exist`);
});

for (const filePath of [
  PR_RESOLUTION_MD,
  CONTEXT_GATHERING_MD,
  AC_VERIFICATION_MD,
  REVIEW_DECISION_MD,
  GITHUB_REVIEW_POSTING_MD,
  WORKTREE_CLEANUP_MD,
]) {
  test(`${path.basename(filePath)} exists`, () => {
    assert.ok(fs.existsSync(filePath), `Expected ${filePath} to exist`);
  });
}

test('SKILL.md uses the reviewing-github-pr skill name', () => {
  const text = read(SKILL_MD);
  assert.ok(
    text.includes('name: reviewing-github-pr'),
    'SKILL.md frontmatter must declare name: reviewing-github-pr',
  );
});

test('SKILL.md separates PR Claim, Required Scope, and Implemented Scope', () => {
  const text = read(SKILL_MD);
  assert.ok(text.includes('PR Claim'), 'SKILL.md must mention PR Claim');
  assert.ok(text.includes('Required Scope'), 'SKILL.md must mention Required Scope');
  assert.ok(text.includes('Implemented Scope'), 'SKILL.md must mention Implemented Scope');
});

test('SKILL.md treats unchecked PR-body task-list items as acceptance criteria', () => {
  const text = read(SKILL_MD).toLowerCase();
  assert.ok(
    text.includes('task-list') || text.includes('task list'),
    'SKILL.md must mention unchecked PR-body task-list items',
  );
});

test('SKILL.md treats PR-body Fixes issue references as the usual Linear lookup starting point', () => {
  const text = read(SKILL_MD);
  assert.ok(text.includes('Fixes'), 'SKILL.md must mention PR-body Fixes references');
  assert.ok(
    text.includes('VD-') || text.includes('VU-') || text.includes('AD-'),
    'SKILL.md must mention typical Linear issue key prefixes found in the PR body',
  );
});

test('SKILL.md requires explicit user approval before posting GitHub review', () => {
  const text = read(SKILL_MD).toLowerCase();
  assert.ok(text.includes('explicit user approval'), 'SKILL.md must require explicit user approval');
  assert.ok(
    text.includes('github pr review') || text.includes('github review event'),
    'SKILL.md must gate GitHub review posting',
  );
});

test('SKILL.md requires cleanup of the temporary review worktree', () => {
  const text = read(SKILL_MD).toLowerCase();
  assert.ok(text.includes('worktree'), 'SKILL.md must mention the temporary review worktree');
  assert.ok(text.includes('clean'), 'SKILL.md must mention cleanup');
});

test('context-gathering.md distinguishes PR/body/code scope from Linear/spec scope', () => {
  const text = read(CONTEXT_GATHERING_MD);
  assert.ok(text.includes('PR Claim'), 'context-gathering.md must mention PR Claim');
  assert.ok(text.includes('PR body'), 'context-gathering.md must source PR Claim from the PR body');
  assert.ok(text.includes('code changes'), 'context-gathering.md must source implemented scope from code changes');
  assert.ok(text.includes('Linear'), 'context-gathering.md must mention Linear-backed required scope');
  assert.ok(text.includes('docs/functional/'), 'context-gathering.md must search docs/functional/');
});

test('ac-verification.md stops the approval path when ACs remain open or unproven', () => {
  const text = read(AC_VERIFICATION_MD).toLowerCase();
  assert.ok(text.includes('unproven'), 'ac-verification.md must mention unproven acceptance criteria');
  assert.ok(text.includes('stop'), 'ac-verification.md must stop the approval path');
  assert.ok(text.includes('check off'), 'ac-verification.md must mention checkoff rules');
});

test('review-decision.md covers approve, request-changes, comment, and close recommendation', () => {
  const text = read(REVIEW_DECISION_MD);
  assert.ok(text.includes('APPROVE'), 'review-decision.md must cover APPROVE');
  assert.ok(text.includes('REQUEST_CHANGES'), 'review-decision.md must cover REQUEST_CHANGES');
  assert.ok(text.includes('COMMENT'), 'review-decision.md must cover COMMENT');
  assert.ok(
    text.toLowerCase().includes('close'),
    'review-decision.md must cover close recommendation for mis-scoped PRs',
  );
});

test('github-review-posting.md requires presenting the drafted review before posting', () => {
  const text = read(GITHUB_REVIEW_POSTING_MD).toLowerCase();
  assert.ok(text.includes('draft'), 'github-review-posting.md must mention the drafted review');
  assert.ok(text.includes('before posting'), 'github-review-posting.md must require a pre-post approval gate');
});

test('worktree-cleanup.md requires removing the temporary worktree and reporting cleanup failures', () => {
  const text = read(WORKTREE_CLEANUP_MD).toLowerCase();
  assert.ok(text.includes('remove'), 'worktree-cleanup.md must remove the temporary worktree');
  assert.ok(
    text.includes('failure') || text.includes('fails'),
    'worktree-cleanup.md must report cleanup failures',
  );
});
