# Why These Constraints

Engineering rationale behind the FILE-block rules in `e2e-authoring-feature-file`.

**Sibling `Background:` copied verbatim** — Background is a harness-wide session-setup contract. Per-file drift fragments it and silently breaks shared fixtures and hooks. If the sibling's Background changes, all feature files in that category should change together — not drift independently.

**Step-vocabulary only (emit `# MISSING STEP:` for gaps)** — Invented step text produces a green-looking `.feature` that fails the first BDD run because no handler exists. Flagging the gap defers work to `e2e-extending-step-vocabulary` where the tool recipe lives.

**Label-based assertions, no CSS selectors** — the harness's MCP browser queries are role/label-based; `#id` / `.class` selectors break on routine DOM refactors and tie tests to internal markup that can change without notice.

**No `browser_evaluate` / `browser_wait_for`** — both bypass the harness's logging, retry, and timeout policy (documented in `{harness_root}/docs/assertion-backends.md`). The allowed alternatives live in `steps/*.md`.

**Derive `$APP_SRC` from `$DATABASE_PATH`, never hardcode** — the layout is env-driven; a hardcoded path breaks the moment anyone moves the checkout or switches environments.

**First-pass `# MISSING STEP:` scan before BDD** — BDD runs cost Playwright + LLM time. A static pre-flight catches vocabulary gaps at zero cost and avoids burning a run on known-bad Gherkin.
