# Acceptance Criteria Gate

Use this gate after the feature branch is rebased and before design
conformance, validation, push, PR creation, or `In Review`.

Review the committed code, tests, and existing verification evidence first,
even when every AC is already checked in Linear. Only after that review may the
PR phase check off proven ACs or stop on missing proof.

| AC state | Action | Continue? |
|---|---|---|
| Already checked in Linear | Leave it checked. | Yes, if all other ACs pass. |
| Unchecked but proven complete by committed work and existing evidence | Check it off in Linear as metadata only. Do not edit files or commit. | Yes, after every AC is checked. |
| Incomplete, unproven, blocked, or requiring code/test/docs | Stop and hand back to `implementing-linear-issue` with the specific ACs. | No. |

Stop on incomplete ACs before the design conformance gate, validation, evals,
push, PR creation, or `In Review`.
