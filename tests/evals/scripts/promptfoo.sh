#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
NODE_BIN="${npm_node_execpath:-$(command -v node)}"

# Keep promptfoo's local state inside repo-local ignored directories so evals
# never create tracked artifacts or depend on ~/.promptfoo.
PROMPTFOO_TMP_DIR="${SCRIPT_DIR}/.tmp/promptfoo"
PROMPTFOO_CACHE_DIR="${SCRIPT_DIR}/.cache/promptfoo"

mkdir -p "$PROMPTFOO_TMP_DIR" "$PROMPTFOO_CACHE_DIR"

export PROMPTFOO_CONFIG_DIR="$PROMPTFOO_TMP_DIR"
export PROMPTFOO_CACHE_PATH="$PROMPTFOO_CACHE_DIR"

exec "$NODE_BIN" "$SCRIPT_DIR/node_modules/promptfoo/dist/src/entrypoint.js" "$@"
