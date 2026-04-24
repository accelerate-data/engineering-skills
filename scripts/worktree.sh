#!/usr/bin/env bash
set -euo pipefail

# Maintainer helper for this repository only.
# Use this from the engineering-skills repo root to create or reattach
# development worktrees and bootstrap local eval state.

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <branch-name>" >&2
  exit 1
fi

branch="$1"

script_dir="$(cd "$(dirname "$0")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
worktree_base="${WORKTREE_BASE_DIR:-$repo_root/../worktrees}"
worktree_path="$worktree_base/$branch"

retry_command() {
  printf '%s %s' "$0" "$branch"
}

json_error() {
  local code="$1"
  local step="$2"
  local message="$3"
  local can_retry="$4"
  local retry_command="$5"
  local suggested_fix="$6"
  local existing_worktree_path="${7:-}"
  BRANCH="$branch" \
  REQUESTED_WORKTREE_PATH="$worktree_path" \
  CODE="$code" \
  STEP="$step" \
  MESSAGE="$message" \
  CAN_RETRY="$can_retry" \
  RETRY_COMMAND="$retry_command" \
  SUGGESTED_FIX="$suggested_fix" \
  EXISTING_WORKTREE_PATH="$existing_worktree_path" \
  python3 - <<'PY' >&2
import json
import os

payload = {
    "code": os.environ["CODE"],
    "step": os.environ["STEP"],
    "message": os.environ["MESSAGE"],
    "branch": os.environ["BRANCH"],
    "requested_worktree_path": os.environ["REQUESTED_WORKTREE_PATH"],
    "can_retry": os.environ["CAN_RETRY"].lower() == "true",
    "retry_command": os.environ["RETRY_COMMAND"],
    "suggested_fix": os.environ["SUGGESTED_FIX"],
}
existing = os.environ.get("EXISTING_WORKTREE_PATH")
if existing:
    payload["existing_worktree_path"] = existing
print(json.dumps(payload))
PY
  exit 1
}

link_env_file() {
  local env_src="$repo_root/.env"
  local env_dst="$worktree_path/.env"

  if [[ ! -f "$env_src" ]]; then
    echo "ENV: skipped (no .env in $repo_root)"
    return
  fi

  if [[ -e "$env_dst" || -L "$env_dst" ]]; then
    rm -f "$env_dst"
  fi

  ln -s "$env_src" "$env_dst"
  echo "ENV: symlink $env_dst -> $env_src"
}

opencode_auth_json_path() {
  local xdg_auth="${XDG_DATA_HOME:-$HOME/.local/share}/opencode/auth.json"
  local legacy_auth="$HOME/.opencode/auth.json"

  if [[ -n "${OPENCODE_AUTH_JSON:-}" ]]; then
    printf '%s\n' "$OPENCODE_AUTH_JSON"
  elif [[ -f "$xdg_auth" ]]; then
    printf '%s\n' "$xdg_auth"
  else
    printf '%s\n' "$legacy_auth"
  fi
}

link_promptfoo_state() {
  local promptfoo_src="$repo_root/tests/evals/.promptfoo"
  local promptfoo_dst="$worktree_path/tests/evals/.promptfoo"
  local opencode_auth_src
  local opencode_auth_dst="$promptfoo_src/opencode-runtime/data/opencode/auth.json"

  opencode_auth_src="$(opencode_auth_json_path)"

  if [[ ! -d "$worktree_path/tests/evals" ]]; then
    echo "PROMPTFOO_DB: skipped (no tests/evals in worktree)"
    return
  fi

  if [[ "$promptfoo_src" == "$promptfoo_dst" ]]; then
    json_error \
      "WORKTREE_PROMPTFOO_SELF_LINK" \
      "link_promptfoo_state" \
      "Refusing to replace the source Promptfoo state directory with a symlink to itself." \
      "false" \
      "" \
      "Run this helper from the main checkout with a separate sibling worktree path."
  fi

  mkdir -p "$promptfoo_src"
  mkdir -p "$(dirname "$opencode_auth_dst")"
  if [[ -f "$opencode_auth_src" ]]; then
    ln -sf "$opencode_auth_src" "$opencode_auth_dst"
    echo "OPENCODE_AUTH: symlink $opencode_auth_dst -> $opencode_auth_src"
  else
    echo "OPENCODE_AUTH: skipped (no auth at $opencode_auth_src)"
  fi

  rm -rf "$promptfoo_dst"
  ln -s "$promptfoo_src" "$promptfoo_dst"
  echo "PROMPTFOO_DB: symlink $promptfoo_dst -> $promptfoo_src"
}

allow_direnv() {
  if ! command -v direnv &>/dev/null; then
    echo "direnv: skipped (not installed)"
    return
  fi

  if [[ ! -f "$worktree_path/.envrc" ]]; then
    echo "direnv: skipped (no .envrc in worktree)"
    return
  fi

  direnv allow "$worktree_path" || json_error \
    "WORKTREE_DIRENV_ALLOW_FAILED" \
    "direnv_allow" \
    "direnv allow failed for the worktree." \
    "true" \
    "$(retry_command)" \
    "Fix direnv or remove the broken .envrc, then rerun the worktree command."
  echo "direnv: allowed $worktree_path"
}

bootstrap_eval_dependencies() {
  local evals_dir="$worktree_path/tests/evals"
  local npm_command=(
    install
    --no-audit
    --no-fund
  )
  local npm_command_str="npm install --no-audit --no-fund"

  if [[ ! -f "$evals_dir/package.json" ]]; then
    echo "npm: skipped (no package.json in tests/evals)"
    return
  fi

  if [[ -f "$evals_dir/package-lock.json" ]]; then
    npm_command=(
      ci
      --no-audit
      --no-fund
    )
    npm_command_str="npm ci --no-audit --no-fund"
  fi

  echo "npm: bootstrapping eval dependencies in $evals_dir with $npm_command_str"
  (
    cd "$evals_dir" &&
      npm "${npm_command[@]}"
  ) || json_error \
    "WORKTREE_NPM_INSTALL_FAILED" \
    "npm_install" \
    "npm dependency bootstrap failed for worktree eval dependencies." \
    "true" \
    "$(retry_command)" \
    "Run 'cd $evals_dir && $npm_command_str' to repair node dependencies, then rerun the worktree command."
}

existing_branch_worktree() {
  local target_branch="$1"
  local current_path=""
  local current_branch=""
  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ -z "$line" ]]; then
      if [[ "$current_branch" == "refs/heads/$target_branch" ]]; then
        printf '%s\n' "$current_path"
        return 0
      fi
      current_path=""
      current_branch=""
      continue
    fi
    case "$line" in
      worktree\ *) current_path="${line#worktree }" ;;
      branch\ *) current_branch="${line#branch }" ;;
    esac
  done < <(git -C "$repo_root" worktree list --porcelain)

  if [[ "$current_branch" == "refs/heads/$target_branch" ]]; then
    printf '%s\n' "$current_path"
  fi
}

bootstrap_worktree() {
  link_env_file
  link_promptfoo_state
  allow_direnv
  bootstrap_eval_dependencies
}

ensure_worktree_base() {
  mkdir -p "$(dirname "$worktree_path")"
}

branch_exists() {
  git -C "$repo_root" show-ref --verify --quiet "refs/heads/$branch"
}

handle_existing_worktree() {
  local checked_out_path="$1"
  local normalized_checked_out_path="$checked_out_path"
  local normalized_worktree_path="$worktree_path"

  if [[ -n "$normalized_checked_out_path" && -d "$normalized_checked_out_path" ]]; then
    normalized_checked_out_path="$(cd "$normalized_checked_out_path" && pwd -P)"
  fi
  if [[ -d "$normalized_worktree_path" ]]; then
    normalized_worktree_path="$(cd "$normalized_worktree_path" && pwd -P)"
  fi

  if [[ -n "$checked_out_path" && "$normalized_checked_out_path" != "$normalized_worktree_path" ]]; then
    json_error \
      "WORKTREE_BRANCH_ALREADY_CHECKED_OUT" \
      "branch_conflict" \
      "Branch is already checked out in another worktree." \
      "false" \
      "" \
      "Use the existing worktree or remove it before requesting a new worktree for this branch." \
      "$checked_out_path"
  fi

  if [[ -n "$checked_out_path" ]]; then
    echo "worktree: branch already attached at $worktree_path; rerunning bootstrap"
    bootstrap_worktree
    echo "worktree: ready $worktree_path"
    exit 0
  fi
}

main() {
  local checked_out_path=""
  local branch_present=false

  ensure_worktree_base
  if branch_exists; then
    branch_present=true
  fi
  checked_out_path="$(existing_branch_worktree "$branch")"
  handle_existing_worktree "$checked_out_path"
  if $branch_present; then
    git -C "$repo_root" worktree add "$worktree_path" "$branch"
  else
    git -C "$repo_root" worktree add -b "$branch" "$worktree_path" HEAD
  fi
  echo "worktree: created worktree at $worktree_path"
  bootstrap_worktree
  echo "worktree: ready $worktree_path"
}

main "$@"
