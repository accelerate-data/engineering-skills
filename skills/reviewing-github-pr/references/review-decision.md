# Review Decision

Run two review lenses after scope framing and acceptance-criteria verification:

- code review for correctness, regressions, scope alignment, and missing tests
- simplification review for avoidable complexity without changing behavior

Choose one proposed outcome:

- `APPROVE` when required scope is satisfied, code review passes, simplification concerns are non-blocking, and all relevant criteria are proven
- `REQUEST_CHANGES` when scope gaps, acceptance-criteria gaps, correctness issues, or testing issues block approval
- `COMMENT` when the review should communicate important context without formal approval or formal change-request semantics

If the PR is substantially mis-scoped relative to the issue or specs, say that directly and recommend close or closing the PR in the drafted review rather than pretending it is a normal `REQUEST_CHANGES` case.
