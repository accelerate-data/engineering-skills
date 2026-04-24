#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
NODE_BIN="${npm_node_execpath:-$(command -v node)}"
OPENCODE_XDG_ROOT="$SCRIPT_DIR/.promptfoo/opencode-runtime"

mkdir -p \
  "$SCRIPT_DIR/.promptfoo" \
  "$SCRIPT_DIR/.cache/promptfoo" \
  "$OPENCODE_XDG_ROOT/state"

# Load .env from repo root if present so evals inherit the same model credentials
# as local development without writing secrets into Promptfoo configs.
if [ -f "$REPO_ROOT/.env" ]; then
  set -a
  . "$REPO_ROOT/.env"
  set +a
fi

export PROMPTFOO_CACHE_PATH="$SCRIPT_DIR/.cache/promptfoo"
export PROMPTFOO_CONFIG_DIR="$SCRIPT_DIR/.promptfoo"
export XDG_STATE_HOME="$OPENCODE_XDG_ROOT/state"

exec "$NODE_BIN" "$SCRIPT_DIR/node_modules/promptfoo/dist/src/entrypoint.js" "$@"
