#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"
repo_root="$(cd "$script_dir/../.." && pwd)"
script_path="$repo_root/scripts/setup-worktree.sh"

tmp_dir="$(mktemp -d)"
cleanup() {
  rm -rf "$tmp_dir"
}
trap cleanup EXIT

mkdir -p "$tmp_dir/worktree/tests/evals"
touch "$tmp_dir/worktree/.envrc"
cat >"$tmp_dir/worktree/tests/evals/package.json" <<'EOF'
{
  "name": "worktree-smoke",
  "private": true,
  "dependencies": {
    "is-number": "7.0.0"
  }
}
EOF

"$script_path" "$tmp_dir/worktree"

if [[ ! -L "$tmp_dir/worktree/.env" ]]; then
  echo "expected .env symlink in worktree" >&2
  exit 1
fi

if [[ "$(readlink "$tmp_dir/worktree/.env")" != "$repo_root/.env" ]]; then
  echo "expected .env symlink target to point at repo root .env" >&2
  exit 1
fi

if [[ ! -d "$tmp_dir/worktree/tests/evals/node_modules/is-number" ]]; then
  echo "expected npm install to create tests/evals/node_modules/is-number" >&2
  exit 1
fi

echo "setup-worktree smoke test passed"
