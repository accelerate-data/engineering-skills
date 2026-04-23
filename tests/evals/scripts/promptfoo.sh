#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
NODE_BIN="${npm_node_execpath:-$(command -v node)}"

# Keep promptfoo's local state inside repo-local ignored directories so evals
# never create tracked artifacts or depend on ~/.promptfoo.
PROMPTFOO_CONFIG_DIR="${SCRIPT_DIR}/.promptfoo"
PROMPTFOO_CACHE_DIR="${SCRIPT_DIR}/.cache/promptfoo"

mkdir -p "$PROMPTFOO_CONFIG_DIR" "$PROMPTFOO_CACHE_DIR"

# Load .env from repo root if present (two levels up from tests/evals/)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
if [ -f "$REPO_ROOT/.env" ]; then
  set -a
  . "$REPO_ROOT/.env"
  set +a
fi

export PROMPTFOO_CACHE_PATH="$PROMPTFOO_CACHE_DIR"
export PROMPTFOO_CONFIG_DIR

exec "$NODE_BIN" "$SCRIPT_DIR/node_modules/promptfoo/dist/src/entrypoint.js" "$@"
