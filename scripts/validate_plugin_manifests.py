#!/usr/bin/env python3
"""Validate Claude and Codex plugin manifests for engineering-skills."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


EXPECTED_NAME = "engineering-skills"
EXPECTED_LICENSE = "ELv2"
MANIFEST_PATHS = (
    Path(".claude-plugin/plugin.json"),
    Path(".codex-plugin/plugin.json"),
)
REQUIRED_FIELDS = ("name", "description", "version", "author", "repository", "license", "skills")
SHARED_FIELDS = ("name", "description", "version", "repository", "license")
SEMVER_RE = re.compile(r"^\d+\.\d+\.\d+$")


def load_json(path: Path) -> dict[str, Any]:
    try:
        with path.open(encoding="utf-8") as handle:
            value = json.load(handle)
    except FileNotFoundError:
        raise ValueError(f"{path}: file is missing") from None
    except json.JSONDecodeError as exc:
        raise ValueError(f"{path}: invalid JSON: {exc}") from None

    if not isinstance(value, dict):
        raise ValueError(f"{path}: manifest must be a JSON object")
    return value


def normalized_skills_path(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    return value.rstrip("/")


def validate(root: Path) -> list[str]:
    manifests: dict[Path, dict[str, Any]] = {}
    errors: list[str] = []

    for relative_path in MANIFEST_PATHS:
        try:
            manifests[relative_path] = load_json(root / relative_path)
        except ValueError as exc:
            errors.append(str(exc))

    if errors:
        return errors

    for relative_path, manifest in manifests.items():
        for field in REQUIRED_FIELDS:
            if field not in manifest:
                errors.append(f"{relative_path}: missing required field '{field}'")

        name = manifest.get("name")
        if name != EXPECTED_NAME:
            errors.append(f"{relative_path}: expected name '{EXPECTED_NAME}', found {name!r}")

        license_value = manifest.get("license")
        if license_value != EXPECTED_LICENSE:
            errors.append(f"{relative_path}: expected license '{EXPECTED_LICENSE}', found {license_value!r}")

        version = manifest.get("version")
        if not isinstance(version, str) or not SEMVER_RE.fullmatch(version):
            errors.append(f"{relative_path}: version must be a semver string like 1.2.3")

        if normalized_skills_path(manifest.get("skills")) != "./skills":
            errors.append(f"{relative_path}: skills must point to './skills'")

    claude = manifests[Path(".claude-plugin/plugin.json")]
    codex = manifests[Path(".codex-plugin/plugin.json")]
    for field in SHARED_FIELDS:
        if claude.get(field) != codex.get(field):
            errors.append(f"manifest mismatch: '{field}' differs between Claude and Codex")

    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path.cwd(), help="repository root")
    args = parser.parse_args(argv)

    errors = validate(args.root)
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1

    print("Plugin manifests are valid.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
