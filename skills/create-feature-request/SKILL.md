---
name: create-feature-request
description: >-
  Creates a feature request in Linear (RO team).
  Triggers on: feature request, log a feature, new feature, request a feature,
  FR, product request.
version: 3.1.0
---

# Create Feature Request

Logs a feature request into the **Roadmap team** in Linear
(`https://linear.app/acceleratedata/team/RO/all`) from free-form natural
language, enriched with Vibedata product context.

## Workflow — 5 Phases

### Phase 0: Load Context

In parallel:

1. Fetch both Vibedata context documents from GitHub using `gh`:

   ```bash
   gh api repos/accelerate-data/vd-specs-product-vision/contents/vibedata-strategy.md --jq '.content' | base64 -d
   gh api repos/accelerate-data/vd-specs-product-architecture/contents/vibedata-architecture.md --jq '.content' | base64 -d
   ```

   If either command fails (authentication error, repo not found, network issue),
   output a **prominent warning**:

   ```text
   ⚠ CONTEXT LOAD FAILED: Could not fetch <filename> from GitHub.
     Reason: <error message>
     Impact: Strategic alignment / Architecture impact fields will be omitted.
     Fix: Run `gh auth login` to authenticate the GitHub CLI.
   ```

   Then continue — enrichment fields will be omitted rather than blocking.

2. Query Linear for live metadata (all three in parallel):
   - list available issue labels (scope, type, persona)
   - list available projects
   - list available statuses for the RO team

Use the Linear tools available in the current agent environment. Do not hard-code
adapter-specific MCP tool names in the workflow.

After loading, output a compact confirmation checklist (✓ files loaded,
✓ labels retrieved, ✓ projects retrieved, ✓ statuses retrieved). Then continue
immediately — no user input needed.

### Phase 1: Parse & Enrich

Parse the user's input for all properties. Use the live label and project lists
from Linear (not hardcoded values) to find the best semantic matches.

#### Standard properties

| Property | Linear Field | Inference Logic |
|---|---|---|
| **Title** | `title` | Clean, action-oriented title under 80 chars |
| **Priority** | `priority` (1–4) | P0/Critical→1(Urgent), P1/High→2(High), P2/Medium→3(Normal), P3/Low→4(Low); default **3 (Normal)** |
| **Estimate** | `estimate` | XS→1, S→2, M→3, L→5; default **2 (S)** |
| **Project** | `project` | Infer "Content" or "Demand-Gen" from scope/context |
| **Labels** | `labels` (array) | At minimum: one `scope:*` label + `feature` type label. Add `persona:*` if inferable |
| **State** | `state` | Use the team's triage/backlog state from the live status list |

#### Context-enriched fields (included in description body)

| Field | Inference Logic |
|---|---|
| **Strategic alignment** | Which product strategy pillar(s) does this support? (from vibedata-strategy.md) |
| **Architecture impact** | Which layers/components are touched (from vibedata-architecture.md) |
| **Business justification** | 1–2 sentences on why this matters for Vibedata's goals |

### Phase 2: Display Preview

Before asking the user anything, output the fully enriched feature request:

```text
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 FEATURE REQUEST PREVIEW  (Linear → RO)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Title:     <title>
Priority:  <Urgent|High|Normal|Low>
Estimate:  <XS(1)|S(2)|M(3)|L(5)>
Project:   <Content|Demand-Gen>
Labels:    <scope:*, feature, persona:*>
State:     <triage state from live list>

Description:
  <description>

Strategic alignment:
  <pillar(s)>

Architecture impact:
  <components>

Business justification:
  <why>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Phase 3: Validate (Human Gate)

Ask the user to confirm with two options:

- **Create this request** — proceed to Phase 4
- **Let me adjust** — user provides changes in natural language; apply changes,
  re-display updated preview, then ask again. Loop until confirmed.

### Phase 4: Create in Linear

Create the Linear issue with the available Linear issue-creation tool using:

```yaml
params:
  title: "<title>"
  team: "RO"
  priority: <1|2|3|4>
  estimate: <1|2|3|5>
  project: "<Content|Demand-Gen>"
  state: "<triage state>"
  labels: ["scope:...", "feature", "persona:..."]
  description: |
    ## Description
    <detailed description from user input>

    ## Strategic Alignment
    <pillar(s) this supports>

    ## Architecture Impact
    <components touched>

    ## Business Justification
    <why this matters for Vibedata>

    ---
    *Logged via /create-feature-request on <YYYY-MM-DD>*
```

After creation, confirm success to the user with the Linear issue identifier
(e.g., `RO-123`) and URL.

## Error Handling

- If GitHub CLI is not authenticated, show the prominent warning from Phase 0
  and continue without enrichment fields.
- If Linear label/project/status queries fail, fall back to hardcoded defaults
  (projects: Content, Demand-Gen; labels: scope/type/persona sets; state:
  "Triage") and note this to the user.
- If the Linear API call fails on creation, show the error and offer to retry.
- If the user's input is too vague to extract a title, ask them to provide at
  least a one-line summary before proceeding.
