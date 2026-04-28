# Backend Recipes

Per-backend conventions for `e2e-extending-step-vocabulary`. Load this at checklist step 6 when drafting the exact recipe for a new step pattern.

## UI

Call `browser_snapshot` **before** any action — extract the target element ref from the snapshot, then act on it:

```text
browser_snapshot → browser_click(ref) / browser_drag(ref) / browser_fill_form(ref, values)
```

Never use `browser_evaluate` or `browser_wait_for` (blocked harness-wide). When a wait is genuinely needed, use `browser_run_code` with an explicit polling loop.

## DB

Use the `{DB_CMD}` placeholder (the harness injects the correct dialect at runtime), **or** spell out both invocations explicitly:

- Local: `sqlite3 "$DATABASE_PATH" "<SQL>"`
- Remote: `psql "$DATABASE_URL" -t -A -c "<SQL>"`

Include the assertion on the result (`> 0`, `= {n}`, `!= ""`). Write the full SQL query — no "use the appropriate query" placeholders.

## Log

Glob `server*.log` to catch rotated files. Follow the pattern in `steps/log-assertions.md` for both local and remote variants. FAIL immediately on 0 matches — no retry, no fallback.

## Filesystem (FS)

Follow the pattern in `steps/fs-assertions.md` for local (`test -d`, `test -f`, `grep`) and remote variants. FAIL immediately on miss — no retry.

## GitHub / gh CLI

```sh
gh api repos/{owner}/{repo}/...
```

Check `gh auth status` before the first API call in a feature. FAIL immediately on auth failure or unexpected HTTP status. No retry.

## Custom backends

Your harness may add further backends (data-lake, object-storage, third-party API, etc.). For each:

- Document both local and remote variants where applicable.
- Reference auth tokens via env vars — never self-mint tokens inside the step recipe.
- Fail immediately on first miss — no retry, no fallback to a different backend.
- Use env vars for service-specific values (workspace IDs, container names, etc.) rather than hardcoding them.

Consult `{harness_root}/docs/assertion-backends.md` for the canonical backend list and env-var conventions for your harness.
