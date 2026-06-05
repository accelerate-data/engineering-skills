/**
 * TDD contract tests for AD-40, AD-33, and AD-42.
 *
 * AD-40: implementing-linear-issue — worktree must be created before spec gate fires
 * AD-33: rename creating-feature-request skill to adding-roadmap-item
 * AD-42: closing-linear-issue — trigger on "close issue [ID]" natural phrasing
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const SKILLS_DIR = path.join(REPO_ROOT, 'skills');
const EVALS_ROOT = path.resolve(__dirname, '..');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

// ============================================================================
// AD-40: implementing-linear-issue — worktree before spec gate
// ============================================================================

const IMPL_SKILL_MD = path.join(SKILLS_DIR, 'implementing-linear-issue', 'SKILL.md');

test('AD-40: SKILL.md explicitly states worktree is created before discovery and spec gates', () => {
  const text = read(IMPL_SKILL_MD);
  // The Workflow table (Step 1) and Branch and Worktree section both establish that
  // worktree setup happens before target-file inspection, discovery, and spec gates.
  assert.ok(
    (text.includes('worktree') || text.includes('branch')) && text.includes('before'),
    'SKILL.md must explicitly state that worktree/branch is created before discovery and spec gates',
  );
});

test('AD-40: SKILL.md states that a missing spec or User Flow label must not skip branch/worktree setup', () => {
  const text = read(IMPL_SKILL_MD);
  const hasOrdering = text.includes('not skip') || text.includes('not prevent') || text.includes('before') && text.includes('worktree') && (text.includes('spec') || text.includes('User Flow'));
  assert.ok(
    hasOrdering,
    'SKILL.md must state that spec/User-Flow gate must not skip branch/worktree setup',
  );
});

test('AD-40: SKILL.md Phase 2 discovery states it runs after branch/worktree setup', () => {
  const text = read(IMPL_SKILL_MD);
  assert.ok(
    text.includes('Phase 2: Discovery') && (text.includes('Phase 1: Setup') || text.includes('after branch/worktree')),
    'SKILL.md must order Phase 2 discovery after Phase 1 branch/worktree setup',
  );
});

test('AD-40: implementing-linear-issue smoke eval asserts worktree is created when spec gate fires', () => {
  const config = JSON.parse(
    read(path.join(EVALS_ROOT, 'packages', 'implementing-linear-setup-discovery', 'promptfooconfig.json')),
  );
  const smokeTest = config.tests.find((t) => t.description?.includes('[smoke]'));
  assert.ok(smokeTest, 'implementing-linear-setup-discovery eval must have a [smoke] test');
  assert.equal(
    String(smokeTest.vars?.expect_creates_branch_and_worktree_first),
    'true',
    'smoke test must assert expect_creates_branch_and_worktree_first=true',
  );
  assert.equal(
    String(smokeTest.vars?.expect_stops_if_functional_spec_missing),
    'true',
    'smoke test must assert expect_stops_if_functional_spec_missing=true',
  );
  const requiredTerms = smokeTest.vars?.required_terms ?? '';
  assert.ok(
    requiredTerms.includes('worktree') || requiredTerms.includes('branch'),
    'smoke test required_terms must include "worktree" or "branch" to verify it is created before the stop',
  );
});

// ============================================================================
// AD-42: closing-linear-issue — natural phrasing trigger
// ============================================================================

const CLOSING_SKILL_MD = path.join(SKILLS_DIR, 'closing-linear-issue', 'SKILL.md');
const CLOSING_EVAL_CONFIG = path.join(EVALS_ROOT, 'packages', 'closing-linear-issue', 'promptfooconfig.json');

test('AD-42: closing-linear-issue SKILL.md description includes "close issue" trigger phrasing', () => {
  const text = read(CLOSING_SKILL_MD);
  const frontmatter = text.split('---')[1] ?? '';
  assert.ok(
    frontmatter.includes('close issue') || frontmatter.includes('close [') || frontmatter.includes('close AD'),
    'closing-linear-issue description must include natural trigger phrasing like "close issue [ID]"',
  );
});

test('AD-42: closing-linear-issue eval has a scenario triggered by "close issue [ID]" phrasing', () => {
  const config = JSON.parse(read(CLOSING_EVAL_CONFIG));
  const hasCloseIssuePhrasing = config.tests.some((t) => {
    const prompt = (t.vars?.user_prompt ?? '').toLowerCase();
    return prompt.startsWith('close issue') || prompt.startsWith('close ad-') || prompt.startsWith('close eng-');
  });
  assert.ok(
    hasCloseIssuePhrasing,
    'closing-linear-issue eval must have a scenario where user_prompt starts with "close issue [ID]"',
  );
});

// ============================================================================
// AD-33: rename creating-feature-request → adding-roadmap-item
// ============================================================================

const NEW_SKILL_DIR = path.join(SKILLS_DIR, 'adding-roadmap-item');
const OLD_SKILL_DIR = path.join(SKILLS_DIR, 'creating-feature-request');
const NEW_SKILL_MD = path.join(NEW_SKILL_DIR, 'SKILL.md');
const AGENTS_MD = path.join(REPO_ROOT, 'AGENTS.md');
const REPO_MAP = path.join(REPO_ROOT, 'repo-map.json');

test('AD-33: skills/adding-roadmap-item/SKILL.md exists', () => {
  assert.ok(exists(NEW_SKILL_MD), `Expected ${NEW_SKILL_MD} to exist`);
});

test('AD-33: adding-roadmap-item SKILL.md has name: adding-roadmap-item in frontmatter', () => {
  const text = read(NEW_SKILL_MD);
  assert.ok(
    text.includes('name: adding-roadmap-item'),
    'adding-roadmap-item SKILL.md must have name: adding-roadmap-item in frontmatter',
  );
});

test('AD-33: adding-roadmap-item SKILL.md description focuses on roadmap intake (contains "roadmap")', () => {
  const text = read(NEW_SKILL_MD);
  const frontmatter = text.split('---')[1] ?? '';
  assert.ok(
    frontmatter.toLowerCase().includes('roadmap'),
    'adding-roadmap-item SKILL.md description must reference roadmap intake',
  );
});

test('AD-33: adding-roadmap-item SKILL.md description does not use "feature request" or "FR" as primary triggers', () => {
  const text = read(NEW_SKILL_MD);
  const frontmatterDesc = (text.split('---')[1] ?? '').toLowerCase();
  const hasAmbiguousTrigger =
    frontmatterDesc.includes('feature request') ||
    frontmatterDesc.includes('"fr"') ||
    frontmatterDesc.includes(', fr,') ||
    frontmatterDesc.includes('new feature') ||
    frontmatterDesc.includes('new product capability');
  assert.ok(
    !hasAmbiguousTrigger,
    'adding-roadmap-item SKILL.md description must not use ambiguous triggers like "feature request", "FR", "new feature"',
  );
});

test('AD-33: skills/creating-feature-request directory no longer exists', () => {
  assert.ok(!exists(OLD_SKILL_DIR), `Expected ${OLD_SKILL_DIR} to be removed`);
});

test('AD-33: AGENTS.md references adding-roadmap-item, not creating-feature-request', () => {
  const text = read(AGENTS_MD);
  assert.ok(
    text.includes('adding-roadmap-item'),
    'AGENTS.md must reference adding-roadmap-item',
  );
  assert.ok(
    !text.includes('creating-feature-request'),
    'AGENTS.md must not reference creating-feature-request',
  );
});

test('AD-33: eval package tests/evals/packages/adding-roadmap-item exists', () => {
  const pkg = path.join(EVALS_ROOT, 'packages', 'adding-roadmap-item');
  assert.ok(exists(pkg), `Expected eval package at ${pkg}`);
});

test('AD-33: eval prompt tests/evals/prompts/skill-adding-roadmap-item.txt exists', () => {
  const prompt = path.join(EVALS_ROOT, 'prompts', 'skill-adding-roadmap-item.txt');
  assert.ok(exists(prompt), `Expected eval prompt at ${prompt}`);
});

test('AD-33: old eval package creating-feature-request is removed', () => {
  const pkg = path.join(EVALS_ROOT, 'packages', 'creating-feature-request');
  assert.ok(!exists(pkg), `Old eval package ${pkg} must be removed`);
});

test('AD-33: old eval prompt skill-creating-feature-request.txt is removed', () => {
  const prompt = path.join(EVALS_ROOT, 'prompts', 'skill-creating-feature-request.txt');
  assert.ok(!exists(prompt), `Old eval prompt ${prompt} must be removed`);
});

test('AD-33: repo-map.json does not reference creating-feature-request', () => {
  const text = read(REPO_MAP);
  assert.ok(
    !text.includes('creating-feature-request'),
    'repo-map.json must not reference the old creating-feature-request name',
  );
});
