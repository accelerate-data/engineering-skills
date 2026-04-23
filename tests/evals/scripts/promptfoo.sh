#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
NODE_BIN="${npm_node_execpath:-$(command -v node)}"
OPENCODE_HOST="${PROMPTFOO_OPENCODE_HOST:-127.0.0.1}"
OPENCODE_PORT="${PROMPTFOO_OPENCODE_PORT:-4096}"
OPENCODE_BASE_URL="http://${OPENCODE_HOST}:${OPENCODE_PORT}"
OPENCODE_MANAGE="${PROMPTFOO_MANAGE_OPENCODE:-1}"
OPENCODE_PID=""
OPENCODE_LOG="${SCRIPT_DIR}/.promptfoo/opencode-server.log"

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

is_opencode_ready() {
  curl -fsS "${OPENCODE_BASE_URL}/" >/dev/null 2>&1
}

cleanup() {
  if [ -n "${OPENCODE_PID}" ] && kill -0 "${OPENCODE_PID}" 2>/dev/null; then
    kill "${OPENCODE_PID}" 2>/dev/null || true
    wait "${OPENCODE_PID}" 2>/dev/null || true
  fi
}

if [ "${OPENCODE_MANAGE}" = "1" ] && ! is_opencode_ready; then
  : >"${OPENCODE_LOG}"
  opencode serve --hostname "${OPENCODE_HOST}" --port "${OPENCODE_PORT}" >>"${OPENCODE_LOG}" 2>&1 &
  OPENCODE_PID=$!
  trap cleanup EXIT INT TERM HUP

  READY=0
  i=0
  while [ "${i}" -lt 50 ]; do
    if is_opencode_ready; then
      READY=1
      break
    fi
    i=$((i + 1))
    sleep 0.2
  done

  if [ "${READY}" -ne 1 ]; then
    echo "Failed to start OpenCode server at ${OPENCODE_BASE_URL}" >&2
    echo "OpenCode log: ${OPENCODE_LOG}" >&2
    exit 1
  fi
fi

exec "$NODE_BIN" "$SCRIPT_DIR/node_modules/promptfoo/dist/src/entrypoint.js" "$@"
