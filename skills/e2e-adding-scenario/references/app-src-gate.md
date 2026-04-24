# Source Verification Gate

Resolve `$APP_SRC` before producing any Gherkin output.

**Override:** if `$E2E_APP_SRC` is set, use it as the `$APP_SRC` candidate and skip `$DATABASE_PATH` derivation. Do **not** skip source verification: when filesystem access is available, verify that `$E2E_APP_SRC` is a readable directory. If it is not readable, HALT with the source-verification message.

**Derivation:** read `{harness_root}/.env` (or `.env.example` only if `.env` is absent).

```text
$APP_SRC = dirname(dirname($DATABASE_PATH))
```

Always reference paths by variable name only — never write the expanded value in any output.

## Auto-discovery fallback

If `$DATABASE_PATH` is unset, empty, or missing from `.env`, **try to find the app root before halting**:

1. List sibling directories of the harness root and immediate parent directories.
2. Look for a directory containing `package.json` plus a source tree (`src/`, `app/`, `lib/`, or similar indicators of a web/app project).
3. **One clear candidate found** → use it as `$APP_SRC` and emit a note: "Auto-detected a readable `$APP_SRC` candidate from sibling app-root discovery. Set `E2E_APP_SRC` explicitly next time to make this deterministic."
4. **Multiple candidates found** → ask the user: "Found multiple candidate app roots by sibling app-root discovery. Which should I use as `$APP_SRC`? Or set `E2E_APP_SRC` directly." Describe each candidate by directory name plus the heuristic that matched it; do not print absolute paths.
5. **No candidate found** → proceed to the HALT below.

## HALT conditions

**HALT immediately** — do not produce any Gherkin, output block, or PLAN action items beyond the halt notice — if any of these is true:

1. `$DATABASE_PATH` is unset or empty in `.env` AND auto-discovery above found no candidate. (Always checkable from `.env` content alone, with no disk access.)
2. You have filesystem access AND the derived (or auto-discovered) `$APP_SRC` directory is not readable.

Do **not** check for specific subdirectories (`src/client/`, `prisma/schema.prisma`, `app/`, etc.) — project layouts vary. The gate confirms only that `$APP_SRC` itself is readable. Layout discovery happens in the next step; if a specific file can't be found there, emit `# LABEL UNVERIFIED:` — do NOT halt again.

**Planning-only context** (no filesystem access, non-empty `$DATABASE_PATH`): treat derivation as provisional and continue, but require re-verification of condition 2 at runtime before any BDD run.

**Derived path doesn't exist on disk** (e.g. `.env` has a relative path valid from the main repo but not from a worktree): include the derived path in the halt message and ask the user to adjust `.env` or set `$E2E_APP_SRC` directly. Do NOT ask a clarifying question — the gate is binary.

## Halt message

> "Source verification failed: \<which condition\>. Set `DATABASE_PATH` in `{harness_root}/.env` so `$APP_SRC` resolves to a readable app source checkout, or set `E2E_APP_SRC` directly. I will not author against unverified source — product labels, routes, and schema must be grounded in the codebase, not guessed."

**Do NOT proceed after halt.** Do NOT borrow labels from sibling files by convention. The halt notice is the entire output.
