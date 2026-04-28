# Sheet Interop — User-Flows-Details

The authoring-flow-spec skill reads the User-Flows-Details Google Sheet to resolve a canonical ID's target repo, category, title, and persona. This file documents the exact `gws` commands the skill uses.

## Sheet coordinates

- **Sheet ID:** `1nq0ab_E6sAjxR7WgihsF92CGfRzj7lCe3Z3GQSu25kA`
- **Primary tab:** `Flow Inventory`
- **Columns read by the skill:** B (Canonical ID), C (repo), D (Category), E (Flow Title), K (Persona). Column C is read for two purposes: per-row target-repo extraction (§1) and the unique target-repo set used by the Phase 0 precondition guard (§4).
- **Columns never written by the skill:** H (Status), F (User Flow Owner),
  G (Product owner), L (Filename HYPERLINK formula), M (Linear)

## Command patterns

### 1. Fetch a specific canonical ID's row

```bash
gws sheets spreadsheets values get --params \
  '{"spreadsheetId":"1nq0ab_E6sAjxR7WgihsF92CGfRzj7lCe3Z3GQSu25kA","range":"Flow Inventory!A2:M"}' \
  --format csv | awk -F, -v id="<canonical-id>" '$2 == id'
```

The skill filters client-side on column B (canonical ID). Sheet-level query
APIs are not used because `gws` does not expose them directly.

Expected output: one CSV row, 13 columns. If no row matches, treat as a child-flow candidate and fall through to Phase 2a of the skill workflow
(longest-prefix parent match).

### 2. List all canonical IDs for the current target repo

Used when the user invokes the skill without a canonical ID and cannot name one. Shows the IDs that belong to the repo you are currently inside.

```bash
gws sheets spreadsheets values get --params \
  '{"spreadsheetId":"1nq0ab_E6sAjxR7WgihsF92CGfRzj7lCe3Z3GQSu25kA","range":"Flow Inventory!B2:E"}' \
  --format csv | awk -F, -v repo="<current-repo>" '$2 == repo { print $1, "-", $4 }'
```

Output shape: one line per flow in that repo, `<canonical-id> - <title>`.
Present this list to the user as numbered choices.

### 3. Authentication check (used in Phase 0)

```bash
gws auth status
```

Exit code `0` means logged in. Non-zero exit or missing command means abort the workflow with the re-auth instructions:

> Run `gws auth login` first, then retry.

### 4. List the unique target repos from column C

Used in Phase 0 of the skill workflow to determine the legitimate set of target repos at runtime. There is no hardcoded whitelist anywhere in the skill — Sheet column C is the canonical source of truth.

```bash
gws sheets spreadsheets values get --params \
  '{"spreadsheetId":"1nq0ab_E6sAjxR7WgihsF92CGfRzj7lCe3Z3GQSu25kA","range":"Flow Inventory!C2:C"}' \
  --format csv \
  | tr -d '\r' \
  | sed 's/^[[:space:]]*//; s/[[:space:]]*$//' \
  | sort -u \
  | grep -Ev '^$|^#N/A$|^pending( |$)'
```

Output shape: zero or more lines, one repo name per line, in sorted order.

**Filter rules:**

- Empty cells, `#N/A`, and any value beginning with `pending` (e.g., `pending repo assignment`) are dropped.
- Surrounding whitespace is trimmed before deduplication.
- The skill compares `git remote get-url origin` against this set case-insensitively after trimming. Preserve the original casing of the Sheet value when displaying the legitimate set in user-facing messages.

**Caching:**

- The skill calls this exactly once per invocation (Phase 0) and reuses the result for the Phase 3 alignment check. Do not re-fetch.

**Failure modes:**

- Resolver returns zero rows → hard-abort the skill with:

  > Sheet column C is empty or has drifted. Verify the User-Flows-Details
  > schema before retrying.

- `gws` exits non-zero → fall through to the §3 auth-check failure path.

## Never do this

- Never write to any Sheet cell from this skill. Writes are the exclusive responsibility of the `update-flow-status` command (for status) and the Sheet-sync rule's documented `gws ... batchUpdate` patterns (for schema).
- Never append a new row for a missing canonical ID. Abort and point the user at `.claude/rules/user-flows-sheet-sync.md` in `vd-specs-product-architecture`.
- Never assume the column layout. If `gws` returns fewer than 13 columns,
  the Sheet schema has drifted — abort and surface the drift to the user.
