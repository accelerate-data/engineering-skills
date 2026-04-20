# Promptfoo DB Helper And Root Scripts Design

## Goal

Make the `raising-linear-pr` eval gate deterministic in normal skill use and allow eval commands to run from the repository root without changing the existing `tests/evals` package boundary.

## Design

Add a Node helper at `tests/evals/scripts/promptfoo-db-gate.js`. The helper accepts the eval command, promptfoo eval description, promptfoo DB path, Git base/head refs, and mapped input paths. It prints JSON evidence with the latest content-relevant commit, latest fully passing promptfoo run, and a `run` or `skip` decision.

The helper fails open to `run` when promptfoo DB evidence is unavailable. That includes missing DB files, unreadable DB files, or no fully passing run for the eval description. It only skips when the latest fully passing eval run is newer than the latest path-limited content change.

Use Node because the eval harness is already a Node package and promptfoo is invoked through that package. The helper uses only Node built-ins plus the existing `git` and `sqlite3` CLIs, so it does not add package dependencies.

Add a root `package.json` with scripts that delegate to `tests/evals` through `npm --prefix tests/evals run ...`. The root package is an ergonomic wrapper only; dependencies and promptfoo state remain owned by `tests/evals`.

## Testing

Add deterministic Node tests for the helper using temporary Git repositories and temporary SQLite DBs. Cover:

- passing eval newer than content change -> `skip`
- unrelated newer commit after eval -> `skip`
- content-relevant commit newer than eval -> `run`
- missing promptfoo DB -> `run`

Run the helper test from both `tests/evals` and the root wrapper.

