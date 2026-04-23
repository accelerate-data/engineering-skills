#!/usr/bin/env python3
"""Require shared Claude/Codex plugin version bumps."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any


CLAUDE_MANIFEST = Path(".claude-plugin/plugin.json")
CODEX_MANIFEST = Path(".codex-plugin/plugin.json")
SEMVER_RE = re.compile(r"^(\d+)\.(\d+)\.(\d+)$")


def parse_semver(value: str) -> tuple[int, int, int]:
    match = SEMVER_RE.fullmatch(value)
    if not match:
        raise ValueError(f"invalid semver version: {value!r}")
    return tuple(int(part) for part in match.groups())


def load_manifest(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as handle:
        value = json.load(handle)
    if not isinstance(value, dict):
        raise ValueError(f"{path}: manifest must be a JSON object")
    return value


def git_show_json(base_ref: str, path: Path) -> dict[str, Any] | None:
    result = subprocess.run(
        ["git", "show", f"{base_ref}:{path.as_posix()}"],
        check=False,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        text=True,
    )
    if result.returncode != 0:
        return None
    value = json.loads(result.stdout)
    if not isinstance(value, dict):
        raise ValueError(f"{base_ref}:{path}: manifest must be a JSON object")
    return value


def validate_version_bump(base_ref: str, root: Path) -> list[str]:
    claude = load_manifest(root / CLAUDE_MANIFEST)
    codex = load_manifest(root / CODEX_MANIFEST)

    claude_version = claude.get("version")
    codex_version = codex.get("version")
    if claude_version != codex_version:
        return [f"Claude and Codex plugin versions must match: {claude_version!r} != {codex_version!r}"]

    if not isinstance(claude_version, str):
        return ["Plugin version must be a string."]

    try:
        current = parse_semver(claude_version)
    except ValueError as exc:
        return [str(exc)]

    base_claude = git_show_json(base_ref, CLAUDE_MANIFEST)
    if not base_claude:
        print(f"No base {CLAUDE_MANIFEST} found at {base_ref}; skipping version comparison.")
        return []

    base_version = base_claude.get("version")
    if not isinstance(base_version, str):
        return [f"{base_ref}:{CLAUDE_MANIFEST}: version must be a string"]

    try:
        previous = parse_semver(base_version)
    except ValueError as exc:
        return [str(exc)]

    if current <= previous:
        return [
            "plugin version was not bumped or was downgraded "
            f"(base {base_version}, current {claude_version})"
        ]

    return []


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-ref", default="origin/main", help="base ref to compare against")
    parser.add_argument("--root", type=Path, default=Path.cwd(), help="repository root")
    args = parser.parse_args(argv)

    errors = validate_version_bump(args.base_ref, args.root)
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1

    print("Plugin version bump is valid.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
