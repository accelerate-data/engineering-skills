# Sheet Operations Reference

Use this reference for all Google Sheets interactions in the `managing-user-flow` skill.
Every operation (add, retire, rename, merge, split) follows these patterns.

## Sheet Coordinates

| Constant | Value |
|---|---|
| Sheet ID | `1nq0ab_E6sAjxR7WgihsF92CGfRzj7lCe3Z3GQSu25kA` |
| Sheet tab | `Flow Inventory` |

### Column Map

| Column | Field | Notes |
|---|---|---|
| A | `#` (row number) | |
| B | Canonical ID | |
| C | repo | |
| D | Category | |
| E | Flow Title | |
| F | User Flow Owner | Leave empty on creation |
| G | Product owner | Leave empty on creation |
| H | Status | |
| I | Wave | Leave empty on creation |
| J | Classification | Leave empty on creation |
| K | Persona | |
| L | Filename | **Never write.** Contains a HYPERLINK formula managed by sheet owners. |
| M | Linear | Written on Add only. |

## Phase 0: Auth Check

Run before any other sheet command.

```bash
gws auth status
```

Exit code 0 means authenticated. Any non-zero exit code, or a "command not found" error, means
the `gws` binary is missing or the session has expired. Abort with:

```text
Run gws auth login first, then retry.
```

## Full-Sheet Read

```bash
gws sheets spreadsheets values get \
  --params '{"spreadsheetId":"1nq0ab_E6sAjxR7WgihsF92CGfRzj7lCe3Z3GQSu25kA","range":"Flow Inventory!A2:M"}' \
  --format csv
```

Cache the result in working memory. All validation and change-preview steps consume the cached
copy. Do not re-fetch the sheet mid-invocation.

## Canonical-ID Lookup

From the cached CSV, find the row where column B equals the target canonical ID.

```bash
# awk -F, -v id="<canonical-id>" '$2 == id'
```

If no row matches, abort with:

```text
Canonical ID '<id>' not found in Flow Inventory sheet. Add the row first.
```

### Row-Number Arithmetic

The sheet read starts at `A2` (row 1 is the header). The CSV returned by `gws` is therefore
zero-indexed from the data: the first data record is CSV index 0, which corresponds to sheet
row 2.

**Sheet row = CSV data row index + 2**

Use this value as `<row>` in all update and range expressions below.

## Cell Update Pattern

Use this pattern to overwrite a single cell or a small range. Parameterise `<row>`, the column
letter(s), and the value body for each use case.

```bash
gws sheets spreadsheets values update \
  --params '{"spreadsheetId":"1nq0ab_E6sAjxR7WgihsF92CGfRzj7lCe3Z3GQSu25kA","range":"Flow Inventory!H<row>","valueInputOption":"USER_ENTERED"}' \
  --json '{"values":[["retired"]]}'
```

`<row>` is the 1-indexed sheet row number (CSV data row index + 2, because row 1 is the header).

## Append-Row Pattern

Use this pattern when adding a new flow. A full row of 13 values (columns A–M) is appended after
the last occupied row.

```bash
gws sheets spreadsheets values append \
  --params '{"spreadsheetId":"1nq0ab_E6sAjxR7WgihsF92CGfRzj7lCe3Z3GQSu25kA","range":"Flow Inventory!A:M","valueInputOption":"USER_ENTERED","insertDataOption":"INSERT_ROWS"}' \
  --json '{"values":[["<#>","<canonical-id>","<repo>","<category>","<title>","","","<status>","","","<persona>","","<linear-label>"]]}'
```

Value positions (zero-based index in the inner array):

| Index | Column | Value |
|---|---|---|
| 0 | A | Row number (`#`) |
| 1 | B | Canonical ID |
| 2 | C | repo |
| 3 | D | Category |
| 4 | E | Flow Title |
| 5 | F | User Flow Owner — always empty string on creation |
| 6 | G | Product owner — always empty string on creation |
| 7 | H | Status |
| 8 | I | Wave — always empty string on creation |
| 9 | J | Classification — always empty string on creation |
| 10 | K | Persona |
| 11 | L | Filename — always empty string (never write a formula here) |
| 12 | M | Linear — set to the new canonical-id string after label creation |

## Constraints

**Never do this:**

- **Never write to column L.** The Filename cell contains a HYPERLINK formula managed by sheet
  owners. Writing any value here will destroy the formula.
- **Never delete a sheet row.** Retire a flow by updating column H to `retired` only.
- **Never assume column layout.** After reading the CSV, verify it has exactly 13 columns. If the
  count differs, abort with:

  ```text
  Sheet schema has drifted. Expected 13 columns (A–M), got <N>.
  ```

- **Never re-fetch the sheet mid-invocation.** Use the Phase 0 cached copy for all reads,
  validation, and previews throughout the current operation.
