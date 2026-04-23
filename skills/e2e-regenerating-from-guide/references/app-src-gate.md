# Source Verification Gate

Resolve `$APP_SRC` before planning any regeneration.

**Override:** if `$E2E_APP_SRC` is set, use it as the `$APP_SRC` candidate and skip `$DATABASE_PATH` derivation. Do **not** skip source verification: when filesystem access is available, verify that `$E2E_APP_SRC` is a readable directory. If it is not readable, HALT with the source-verification message.

**Derivation:** read `{harness_root}/.env` (or `.env.example` only if `.env` is absent).

```text
$APP_SRC = dirname(dirname($DATABASE_PATH))
```

Always reference paths by variable name only — never write the expanded value in any output.

## Auto-discovery fallback

If `$DATABASE_PATH` is unset, empty, commented-out, or missing from `.env`, **try to find the app root before halting**:

1. List sibling directories of the harness root and immediate parent directories.
2. Look for a directory containing `package.json` plus a source tree (`src/`, `app/`, `lib/`, or similar indicators of a web/app project).
3. **One clear candidate found** → use it as `$APP_SRC` and emit a note: "Auto-detected a readable `$APP_SRC` candidate from sibling app-root discovery. Set `E2E_APP_SRC` explicitly next time to make this deterministic."
4. **Multiple candidates found** → ask the user: "Found multiple candidate app roots by sibling app-root discovery. Which should I use as `$APP_SRC`? Or set `E2E_APP_SRC` directly." Describe each candidate by directory name plus the heuristic that matched it; do not print absolute paths.
5. **No candidate found** → proceed to the HALT below.

## HALT conditions

**HALT immediately** — produce ONLY the halt notice; do NOT write a PLAN, a MAPPINGS edit, or any `./generate-features.sh` invocation — if any of these is true:

1. `$DATABASE_PATH` is unset, empty, a blank string, or **commented out** in `.env` AND auto-discovery above found no candidate. **This gate is iron-clad** — "planning-only context" is NOT a license to skip it.
2. You have filesystem access AND the derived (or auto-discovered) `$APP_SRC` directory is not readable.
3. `DATABASE_URL` is set without `DATABASE_PATH` (remote env) — refuse and escalate; distinct condition from conditions 1 and 2 above.

Do **not** check for specific subdirectories — layouts vary. The gate confirms only that `$APP_SRC` itself is readable. The guide path (`$APP_SRC/docs/user-guide/...`) is verified separately at step 2.

## Edge cases

**Planning-only context** (no filesystem access, non-empty uncommented `$DATABASE_PATH`): treat derivation as provisional and continue, but emit a reviewer note that condition 2 must be re-verified at runtime before `./generate-features.sh` runs.

**Derived path doesn't exist on disk** (e.g. `.env` has a relative path valid from the main repo but not from a worktree): include the derived path in the halt message and ask the user to adjust `.env` or set `$E2E_APP_SRC` directly. Do NOT ask a clarifying question.

## Halt message

> "Source verification failed: \<which condition\>. Set `DATABASE_PATH` in `{harness_root}/.env` so `$APP_SRC` resolves to a readable app source checkout, or set `E2E_APP_SRC` directly. I will not plan a regeneration against unverified source — the guide path itself lives under `$APP_SRC/docs/user-guide/**`, and the generator reads product source for label grounding. Both require a resolved `$APP_SRC`."

**Do NOT proceed after halt.** The halt notice is the entire output — no PLAN follows it.
