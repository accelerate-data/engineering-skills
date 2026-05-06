const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const SKILL_DIR = path.join(REPO_ROOT, 'skills', 'maintaining-user-flows');
const SKILL_MD = path.join(SKILL_DIR, 'SKILL.md');
const DRIFT_MD = path.join(SKILL_DIR, 'references', 'drift.md');
const SHEET_OPS_MD = path.join(SKILL_DIR, 'references', 'sheet-ops.md');
const ADD_MD = path.join(SKILL_DIR, 'references', 'add.md');
const RENAME_MD = path.join(SKILL_DIR, 'references', 'rename.md');
const RETIRE_MD = path.join(SKILL_DIR, 'references', 'retire.md');
const MERGE_MD = path.join(SKILL_DIR, 'references', 'merge.md');
const SPLIT_MD = path.join(SKILL_DIR, 'references', 'split.md');

function readSkill() {
  return fs.readFileSync(SKILL_MD, 'utf8');
}

function readDrift() {
  return fs.readFileSync(DRIFT_MD, 'utf8');
}

function readSheetOps() {
  return fs.readFileSync(SHEET_OPS_MD, 'utf8');
}

function readReference(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

// ---------------------------------------------------------------------------
// drift.md existence and content
// ---------------------------------------------------------------------------

test('drift.md exists', () => {
  assert.ok(fs.existsSync(DRIFT_MD), `Expected ${DRIFT_MD} to exist`);
});

test('drift.md documents the A–B (sheet-only) computation', () => {
  const text = readDrift();
  assert.ok(
    text.includes('retired') && text.includes('parked') && (text.includes('A–B') || text.includes('sheet-only')),
    'drift.md must document A–B computation excluding retired and parked rows',
  );
});

test('drift.md documents the B–A (Linear-only) computation', () => {
  const text = readDrift();
  assert.ok(
    text.includes('B–A') || text.includes('Linear-only'),
    'drift.md must document B–A computation',
  );
});

test('drift.md output format contains Drift Report header', () => {
  const text = readDrift();
  assert.ok(text.includes('Drift Report'), 'drift.md must include the "Drift Report" output header');
});

test('drift.md output format contains "No action taken" footer', () => {
  const text = readDrift();
  assert.ok(text.includes('No action taken'), 'drift.md must include the "No action taken" footer');
});

test('drift.md documents in-sync empty state message', () => {
  const text = readDrift();
  assert.ok(
    text.includes('Sheet and Linear are in sync'),
    'drift.md must document the "Sheet and Linear are in sync. No action needed." message',
  );
});

test('drift.md documents that it is read-only (no writes)', () => {
  const text = readDrift();
  assert.ok(
    text.toLowerCase().includes('read-only') || text.toLowerCase().includes('no write') || text.toLowerCase().includes('no additional fetch'),
    'drift.md must document that it is read-only',
  );
});

test('drift.md documents when drift is invoked (natural language and post-write)', () => {
  const text = readDrift();
  const hasNaturalLanguage = text.includes('check sync') || text.includes('natural language') || text.includes('show drift');
  const hasPostWrite = text.includes('post-change') || text.includes('every write') || text.includes('Verification');
  assert.ok(hasNaturalLanguage, 'drift.md must document natural-language invocation trigger');
  assert.ok(hasPostWrite, 'drift.md must document automatic invocation after every write');
});

// ---------------------------------------------------------------------------
// SKILL.md — drift in frontmatter
// ---------------------------------------------------------------------------

test('SKILL.md argument-hint includes drift', () => {
  const text = readSkill();
  assert.ok(
    text.includes('argument-hint') && text.includes('drift'),
    'SKILL.md argument-hint must include drift',
  );
});

test('SKILL.md description mentions checking sync or drift', () => {
  const text = readSkill();
  // The frontmatter description block should reference drift or checking sync
  const frontmatter = text.split('---')[1] || '';
  assert.ok(
    frontmatter.includes('drift') || frontmatter.includes('checking sync'),
    'SKILL.md frontmatter description must mention drift or checking sync',
  );
});

// ---------------------------------------------------------------------------
// SKILL.md — drift in When to Use
// ---------------------------------------------------------------------------

test('SKILL.md When to Use section mentions drift', () => {
  const text = readSkill();
  const whenSection = text.split('## When to Use')[1]?.split('##')[0] ?? '';
  assert.ok(
    whenSection.includes('drift') || whenSection.includes('check sync') || whenSection.includes('checking sync'),
    'SKILL.md "When to Use" section must mention drift or check sync',
  );
});

// ---------------------------------------------------------------------------
// SKILL.md — drift in Phase 0 ambiguity prompt
// ---------------------------------------------------------------------------

test('SKILL.md Phase 0 ambiguity prompt includes drift', () => {
  const text = readSkill();
  const phase0 = text.split('## Phase 0')[1]?.split('##')[0] ?? '';
  assert.ok(
    phase0.includes('drift'),
    'SKILL.md Phase 0 ambiguity prompt must include drift as an operation option',
  );
});

// ---------------------------------------------------------------------------
// SKILL.md — schema check in Phase 0
// ---------------------------------------------------------------------------

test('SKILL.md Phase 0 aborts when CSV has fewer than 13 columns', () => {
  const text = readSkill();
  const phase0 = text.split('## Phase 0')[1]?.split('##')[0] ?? '';
  assert.ok(
    phase0.includes('exactly 13') || (phase0.includes('13') && phase0.includes('exactly')),
    'SKILL.md Phase 0 must require exactly 13 columns before any operation',
  );
});

// ---------------------------------------------------------------------------
// SKILL.md — drift in Phase 1 routing table
// ---------------------------------------------------------------------------

test('SKILL.md Phase 1 routing table contains a drift row', () => {
  const text = readSkill();
  const phase1 = text.split('## Phase 1')[1]?.split('##')[0] ?? '';
  assert.ok(
    phase1.includes('drift') && phase1.includes('references/drift.md'),
    'SKILL.md Phase 1 routing table must contain a drift row pointing to references/drift.md',
  );
});

// ---------------------------------------------------------------------------
// SKILL.md — error reporting section
// ---------------------------------------------------------------------------

test('SKILL.md has an Error Reporting section', () => {
  const text = readSkill();
  assert.ok(
    text.includes('Error Reporting') || text.includes('error reporting'),
    'SKILL.md must have an Error Reporting section',
  );
});

test('SKILL.md error reporting requires batch failures to be surfaced at the end', () => {
  const text = readSkill();
  const errorSection = text.split(/## Error Reporting/i)[1]?.split('##')[0] ?? '';
  assert.ok(
    errorSection.length > 0,
    'SKILL.md Error Reporting section must have content',
  );
  assert.ok(
    errorSection.toLowerCase().includes('fail') || errorSection.toLowerCase().includes('surface'),
    'SKILL.md Error Reporting must document surfacing failures',
  );
});

test('SKILL.md error reporting prohibits silently swallowing failures', () => {
  const text = readSkill();
  assert.ok(
    text.includes('silently') || text.includes('silent'),
    'SKILL.md must prohibit silently swallowing failures',
  );
});

// ---------------------------------------------------------------------------
// Drift/write contract hardening
// ---------------------------------------------------------------------------

test('drift.md documents cache mutation before post-write verification instead of re-fetching', () => {
  const text = readDrift().toLowerCase();
  assert.ok(
    text.includes('update the cached state') || text.includes('mutate the cached state'),
    'drift.md must explain that write operations update cached state before verification',
  );
  assert.ok(
    text.includes('do not re-fetch the sheet'),
    'drift.md must restate that post-write verification does not re-fetch the sheet',
  );
});

for (const [name, filePath] of [
  ['add.md', ADD_MD],
  ['rename.md', RENAME_MD],
  ['retire.md', RETIRE_MD],
  ['merge.md', MERGE_MD],
  ['split.md', SPLIT_MD],
]) {
  test(`${name} updates cached state after successful writes`, () => {
    const text = readReference(filePath).toLowerCase();
    assert.ok(
      text.includes('cached state') || text.includes('cached sheet') || text.includes('cached label list'),
      `${name} must explain how successful writes update cached state for verification`,
    );
  });
}

test('sheet-ops.md says column M is populated for any appended flow row, not add only', () => {
  const text = readSheetOps();
  assert.ok(
    !text.includes('Written on Add only.'),
    'sheet-ops.md must not claim column M is written on add only',
  );
  assert.ok(
    text.includes('appended') && text.includes('merge') && text.includes('split'),
    'sheet-ops.md must clarify that appended rows from add, merge, and split populate column M',
  );
});
