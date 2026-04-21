#!/usr/bin/env bash
# write-tests gate: PreToolUse hook that blocks Write/Edit/MultiEdit/NotebookEdit
# on test files unless the transcript contains the '## Approved behaviours' marker.
#
# Install (project): add to .claude/settings.json
# {
#   "hooks": {
#     "PreToolUse": [
#       {
#         "matcher": "Write|Edit|MultiEdit|NotebookEdit",
#         "hooks": [
#           { "type": "command", "command": "bash ${HOME}/.claude/skills/write-tests/hooks/gate.sh" }
#         ]
#       }
#     ]
#   }
# }

set -euo pipefail

INPUT=$(cat)

TOOL_NAME=$(printf '%s' "$INPUT" | jq -r '.tool_name // empty')
FILE_PATH=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty')
TRANSCRIPT=$(printf '%s' "$INPUT" | jq -r '.transcript_path // empty')

case "$TOOL_NAME" in
  Write|Edit|MultiEdit|NotebookEdit) ;;
  *) exit 0 ;;
esac

is_test_file() {
  local p="$1"
  [[ "$p" =~ \.(test|spec)\.[jt]sx?$ ]] && return 0
  [[ "$p" =~ \.(test|spec)\.m?[jt]s$ ]] && return 0
  [[ "$p" =~ /test_[^/]+\.py$ ]] && return 0
  [[ "$p" =~ _test\.py$ ]] && return 0
  [[ "$p" =~ _test\.go$ ]] && return 0
  [[ "$p" =~ _(spec|test)\.rb$ ]] && return 0
  [[ "$p" =~ Test\.(java|kt)$ ]] && return 0
  [[ "$p" == *"/__tests__/"* ]] && return 0
  return 1
}

if ! is_test_file "$FILE_PATH"; then
  exit 0
fi

if [[ -z "$TRANSCRIPT" || ! -f "$TRANSCRIPT" ]]; then
  # Cannot verify — fail open rather than false-positive block.
  exit 0
fi

if ! grep -q '## Approved behaviours' "$TRANSCRIPT"; then
  cat >&2 <<'MSG'
BLOCKED by write-tests gate: about to write a test file without approved behaviours.

Per the write-tests skill (Step 3), you must post this exact header and get user approval BEFORE writing tests:

    ## Approved behaviours

    | # | Behaviour | Scenario |
    |---|-----------|----------|
    | 1 | ...       | ...      |

Tests derived without an approved behaviour list couple to implementation. Post the table, wait for approval, then retry the write.
MSG
  exit 2
fi

exit 0
