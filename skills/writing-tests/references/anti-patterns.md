# Anti-Patterns — Never Do These

| Anti-pattern | Why it's bad |
|---|---|
| `expect(x).toBeInTheDocument()` as only assertion | Proves nothing — component could render empty |
| Asserting on stubs you set up | Circular — testing your own mock setup |
| `toHaveBeenCalledWith` for internal helper calls | Couples to implementation, breaks on refactor |
| Mocking managed dependencies (own stores, services, DB) | Tests the mock, not the code |
| Using `vi.mock` in this project's unit tests | Domain code has no collaborators — if you need a mock, you've crossed a collaborator boundary (a flow/e2e concern, not a unit test) |
| Ask user "what should I test?" without recommending first | Every question leads with a recommendation |
| Skipping Step 2 audit | Existing tests may violate standards — audit is mandatory |
| Asserting current buggy behaviour as "expected" | Protects the bug, not the user |
| Test-per-method organisation | Organise by behaviour, not API surface |
| Test setup longer than the test | Probably overcomplicated code — apply Humble Object |
| Testing private methods | They're private for a reason — test the public API |
| Over-mocking (mocking your own modules) | Testing the mock, not the code |
| "Renders without crashing" as only assertion | Component could render empty and pass |
| Same thing tested in unit AND flow/e2e | Duplication — two tests break on one code change |
| Creating a `*.integration.test.*` file | Not a valid test type — unit/component tests are `*.test.ts(x)`; cross-module flows live in the repo's flow/e2e layer |
| Hidden integration in a unit file (real DB/HTTP/app boot in `*.test.ts`) | A flow test mislabeled — slow, brittle, escapes the unit lane |
| Tests written to hit coverage numbers | Meaningless assertions on implementation details |
| Agent writes its own tests | Self-attestation — agent confirms its own work including bugs |
