# BDD Run Loop

Run at skill runtime only — not during eval output or planning-only contexts.

## Command form

```bash
npm run test:bdd -- <cat>/<name> > /tmp/bdd-<cat>-<name>.log 2>&1 &
```

Run from the harness root. Redirect **directly to a log file** — do NOT pipe through `| tail -N` or any other filter. Pipes buffer until the whole pipeline exits and can make a backgrounded invocation appear silent for many minutes. A direct `> file 2>&1` redirect captures output line-by-line as BDD emits it.

Alternatively, use the runtime's `run_in_background` option — but still redirect to a log file.

## Polling

Poll every ~5 minutes while it runs:

```bash
wc -l /tmp/bdd-<cat>-<name>.log && tail -40 /tmp/bdd-<cat>-<name>.log
```

Report current scenario count and last-seen step. A BDD run can take 5–20+ minutes — do not sit silently. If the log hasn't grown between polls, check whether the process is alive: `ps aux | grep test:bdd`.

## On red results

Diagnose from the log → fix the scenario (without weakening assertions) → rerun. After **5 red iterations**, stop and escalate to the user with the last failure output.

## On completion

Report final pass/fail count, any fixture or step-vocabulary gaps encountered, and which log file holds the full output.
