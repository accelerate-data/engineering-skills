# Creating Product Issues

## Goal

Walk through how AD engineers should invoke the `creating-product-issues` skill to file product issues for the Studio and Utilities product areas in Linear.

The skill is intentionally narrower than `creating-linear-issue`. It only files into two teams (Studio and Utilities), resolves the owner from a static map, and never sets a `project`, `milestone`, or `cycle`.

## When to Use

Use `creating-product-issues` when the request is about Studio or Utilities product behavior — a feature, a bug, a feedback item, or a spike against those product areas.

Use `creating-linear-issue` instead when:

- The work belongs to an engineering team (not Studio or Utilities).
- The work belongs to a Linear project, milestone, or cycle.
- The request is internal infrastructure, plumbing, or non-product follow-up.

If you are not sure which team owns the work, default to `creating-product-issues` only if the work clearly lives in Studio or Utilities. Otherwise, file into the engineering flow and let triage move it.

## Invocation

From a Claude Code session:

```text
/creating-product-issues <one-line request>
```

Or simply describe the request and let the skill pick itself up.

## Static Team-to-Owner Map

The skill resolves the owner from a fixed table, not from the user running the skill:

| Team | Owner | Email |
|---|---|---|
| Studio | Umesh Kakkad (UK) | uk@acceleratedata.ai |
| Utilities | Hemanta Banerjee (HB) | hb@acceleratedata.ai |

The skill looks up the Linear user by that email at runtime. Do not pass an owner manually — the static map is the source of truth.

## Hard Gates

The skill stops at four gates. Each is intentional and tells you something is missing.

### 1. Off-list team

The skill files only into `Studio` or `Utilities`. If the request resolves to any other team (for example, an engineering team, Finance, or Roadmap), the skill stops and explains the allowlist.

**What to do:** decide whether the request actually belongs to Studio or Utilities. If it does, restate the request to make the team explicit. If it does not, switch to `creating-linear-issue` or the relevant team's intake flow. If the right target is unclear, email `ss@acceleratedata.ai`.

### 2. Missing User Flow child label

Both Studio and Utilities require a `User Flow` child label on every issue. The skill resolves labels at runtime and proposes one match (or lists close alternatives). If no candidate matches the request, the skill stops and asks you to pick a child label.

**What to do:** pick a child label from the list the skill shows you. If no existing child label fits, either pick the closest match and rename later, or add a new child label in Linear before re-running the skill.

### 3. Functional spec missing

The skill reads the matching functional spec before drafting. The path is `docs/functional/<UF-…>/README.md` keyed off the User Flow child label.

**What to do:** if the spec is missing, the skill stops and asks you to author it first. Use the spec template in this repo. Do not bypass this gate — implementation traceability depends on the spec.

### 4. Linear user-by-email lookup failure

The owner is resolved by email lookup against Linear. The skill retries once. If both attempts fail, the skill stops and reports the failing call.

**What to do:** check Linear MCP connectivity (auth, network, rate limits). Do not fall back to leaving the issue unassigned or assigning yourself — re-run the skill once Linear is reachable.

## Fields the Skill Does NOT Set

The skill explicitly omits these fields from every issue it files:

- `project`
- `milestone`
- `cycle`

Product issues filed by this skill are intake-shaped: triage will assign them to the right project, milestone, or cycle after review. If you find yourself wanting to set any of these fields up front, use `creating-linear-issue` or update the issue manually in Linear after triage.

## Worked Example — Studio Feature Request

A one-line request comes in: *"Add a 'duplicate dashboard' shortcut on the Studio dashboard list."*

1. **Invocation.** You run `/creating-product-issues Add a 'duplicate dashboard' shortcut on the Studio dashboard list.`
2. **Classification.** The skill classifies this as a `feature`.
3. **Codebase search.** The skill searches the Studio surface for the existing dashboard list and existing duplicate-related actions.
4. **Team resolution.** The team resolves to `Studio` (in the allowlist).
5. **User Flow label.** The skill lists `User Flow` child labels at workspace scope, finds one strong match (`UF-Dashboard-Management`), and proposes it.
6. **Functional spec.** The skill reads `docs/functional/UF-Dashboard-Management/README.md`.
7. **Design docs.** The skill searches `docs/design/` for related entries. None found — recorded as `not_applicable`.
8. **Owner lookup.** The skill resolves `uk@acceleratedata.ai` to Umesh Kakkad in Linear.
9. **Confirmation.** The skill asks one question: confirm team = Studio, owner = Umesh Kakkad, User Flow label = UF-Dashboard-Management, functional spec path.
10. **Draft.** You approve. The skill shows the full issue draft (Problem, Goal, Non-goals, Acceptance Criteria, Risks, Test Notes, with the functional spec path and no design doc).
11. **Create.** You approve the draft. The skill creates the Linear issue in Studio, assigned to Umesh Kakkad, with the User Flow child label, no project, no milestone, no cycle.

The filed issue is ready for triage to assign downstream metadata.

## Related Skills

- `creating-linear-issue` — engineering-team intake (any team, any project/milestone/cycle).
- `implementing-linear-issue` — picks up a filed issue and implements it.
- `raising-linear-pr` — opens a PR for a completed issue.
