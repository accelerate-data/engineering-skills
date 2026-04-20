#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"
repo_root="$(cd "$script_dir/../.." && pwd)"
script_path="$repo_root/scripts/worktree.sh"

tmp_dir="$(mktemp -d)"
cleanup() {
  rm -rf "$tmp_dir"
}
trap cleanup EXIT

source_repo="$tmp_dir/repo"
mkdir -p "$source_repo"
tar \
  --exclude .git \
  --exclude tests/evals/node_modules \
  --exclude tests/evals/.cache \
  --exclude tests/evals/.promptfoo \
  --exclude tests/evals/.tmp \
  -C "$repo_root" \
  -cf - . | tar -C "$source_repo" -xf -

mkdir -p "$source_repo/tests/evals"
touch "$source_repo/.env"
touch "$source_repo/.envrc"
cat >"$source_repo/tests/evals/package.json" <<'JSON'
{
  "name": "worktree-smoke",
  "private": true,
  "dependencies": {
    "is-number": "7.0.0"
  }
}
JSON
(
  cd "$source_repo/tests/evals"
  npm install --package-lock-only --no-audit --no-fund >/dev/null
)

git -C "$source_repo" init -q
git -C "$source_repo" config user.email "agent@example.com"
git -C "$source_repo" config user.name "Agent"
git -C "$source_repo" add .
git -C "$source_repo" commit -q -m "initial"

WORKTREE_BASE_DIR="$tmp_dir/worktrees" "$source_repo/scripts/worktree.sh" feature/example

worktree_path="$tmp_dir/worktrees/feature/example"
if [[ ! -d "$worktree_path/.git" && ! -f "$worktree_path/.git" ]]; then
  echo "expected worktree to be created at $worktree_path" >&2
  exit 1
fi

if [[ ! -L "$worktree_path/.env" ]]; then
  echo "expected .env symlink in worktree" >&2
  exit 1
fi

if [[ "$(readlink "$worktree_path/.env")" != "$source_repo/.env" ]]; then
  echo "expected .env symlink target to point at repo root .env" >&2
  exit 1
fi

if [[ ! -L "$worktree_path/tests/evals/.promptfoo" ]]; then
  echo "expected promptfoo state symlink in worktree" >&2
  exit 1
fi

if [[ "$(readlink "$worktree_path/tests/evals/.promptfoo")" != "$source_repo/tests/evals/.promptfoo" ]]; then
  echo "expected promptfoo state symlink target to point at repo root tests/evals/.promptfoo" >&2
  exit 1
fi

if [[ ! -d "$worktree_path/tests/evals/node_modules/is-number" ]]; then
  echo "expected npm bootstrap to create tests/evals/node_modules/is-number" >&2
  exit 1
fi

WORKTREE_BASE_DIR="$tmp_dir/worktrees" "$source_repo/scripts/worktree.sh" feature/example

echo "worktree smoke test passed"
