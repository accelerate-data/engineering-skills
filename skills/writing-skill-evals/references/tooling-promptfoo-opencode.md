# Tooling — promptfoo + opencode

How to wire the harness without growing it into a second framework.

## Why this stack

- **promptfoo** = test runner. Per-case providers, assertions, parallelism, caching, result store. Already used for end-to-end skill evals; reuse don't replace.
- **opencode** = LLM caller, agent definition layer. Auth, model selection, tool plumbing. Lets us define a *minimal* agent that loads only the target skill into context — no coordinator, no sibling skills.

Both repositories ship with promptfoo + opencode already configured for end-to-end evals. The slice harness is a *thin* addition on top, not a parallel system.

## The eval_slice opencode agent

One agent definition, parameterized per case via system-prompt template:

```jsonc
// opencode.json (excerpt)
{
  "agent": {
    "eval_slice": {
      "mode": "primary",
      "model": "claude-sonnet-4-6-20250929",  // pin specific version
      "temperature": 0,
      "steps": 30,
      "prompt": "{{TARGET_SKILL_MARKDOWN}}",  // templated per case
      "permission": {
        "read": "allow", "write": "allow", "edit": "allow",
        "bash": "allow", "grep": "allow", "glob": "allow", "list": "allow",
        "webfetch": "deny"
      }
    }
  }
}
```

The provider (`scripts/eval-slice-provider.js`) reads the target skill's `SKILL.md`, substitutes it into the system prompt, and spawns opencode with the eval_slice agent. The coordinator agent never enters the picture.

## Skill-tool stub (MCP)

Opencode has no native `Skill` tool. For decision tests that assert sub-skill invocation, register a stub MCP server that exposes a `Skill` tool returning the call args:

```python
# scripts/mcp-skill-stub.py
@server.tool("Skill")
async def skill_stub(skill: str, args: dict = {}) -> dict:
    # Capture the call instead of dispatching
    return {
        "_captured": True,
        "skill": skill,
        "args": args,
    }
```

The provider mounts this stub when `unitconfig.json` declares `mode: decision` and `stubs: ["Skill"]`. The captured call appears in the agent's tool-output stream; the harness extracts it for assertion.

For other stubbed tools (Bash, etc.) the same pattern applies: a stub returns `{ _captured: true, ... }` instead of executing.

## Suite layout

```
tests/evals/
├── packages/                    # existing — end-to-end smoke + tier packages
└── units/                       # new — slice suite
    ├── _harness/
    │   ├── eval-slice-provider.js
    │   ├── mcp-skill-stub.py
    │   ├── capture-prefix.js
    │   └── assertion-helpers/
    └── <skill-name>/
        ├── unitconfig.json      # suite-level defaults
        └── cases/
            ├── case01-<scenario>/
            │   ├── prompt.md
            │   ├── fixture/
            │   ├── env.json
            │   ├── expected.json
            │   └── unitconfig.json
            └── case02-<scenario>/
```

## ad-evals CLI integration

Add a new script in `tests/evals/package.json`:

```json
{
  "scripts": {
    "eval:units": "node scripts/run-evals-local.js units",
    "eval:units:skill": "node scripts/run-evals-local.js units --skill"
  }
}
```

The `units` mode in `run-evals-local.js` discovers cases via `units/<skill>/cases/<case>/unitconfig.json` (parallel to how `packages/<pkg>/promptfooconfig.json` is discovered today). Reuse `discoverPackageConfigs` with a different glob.

## Provider-mode flag per case

`unitconfig.json` declares per-case:

```json
{
  "mode": "decision" | "reaction",
  "stubs": ["Skill"],
  "dry_run": false,
  "fixture": "_shared/intent-typical",
  "model": "claude-sonnet-4-6-20250929",
  "assertions": [ ... ]
}
```

The provider reads `mode`, `stubs`, and `dry_run` to configure opencode and append the dry-run suffix (if any).

## What NOT to add to the harness

- **A second runtime** beside opencode (claude-agent-sdk-provider, raw Anthropic SDK, etc.) — keep the LLM caller singular per project. Mixing runtimes makes results incomparable.
- **A custom assertion DSL** — promptfoo's JS assertions handle every class we need.
- **A "plan mode" provider** — dry-run is a per-case prompt suffix, not a harness mode.
- **A central stub registry** — stubs live with the case that uses them, declared in unitconfig.
