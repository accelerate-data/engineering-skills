# Acceptance-Criteria Verification

Review unchecked acceptance criteria from both sources:

- linked Linear issue acceptance criteria
- unchecked PR-body task-list items

For each criterion:

1. Check whether the current code and diff satisfy it.
2. If code inspection is insufficient, run the narrowest targeted validation or tests that can prove it.
3. Check off the criterion only when it is proven by committed code and evidence.

Hard rules:

- Never check off a criterion speculatively.
- If any criterion remains open, ambiguous, blocked, or unproven, stop the approval path.
- When stopping, draft concrete next steps for the review comment instead of approving.

Open or unproven criteria block `APPROVE` even when the code looks close.
