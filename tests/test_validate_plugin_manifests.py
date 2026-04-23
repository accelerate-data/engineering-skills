from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from scripts.validate_plugin_manifests import validate


def write_manifest(root: Path, relative_path: str, **overrides: object) -> None:
    manifest = {
        "name": "engineering-skills",
        "description": "Shared engineering-team skills for code review, issue workflow, UI work, and browser automation.",
        "version": "1.0.7",
        "author": {"name": "Accelerate Data"},
        "repository": "https://github.com/accelerate-data/engineering-skills",
        "license": "ELv2",
        "skills": "./skills",
    }
    manifest.update(overrides)
    path = root / relative_path
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(manifest), encoding="utf-8")


def write_valid_pair(root: Path) -> None:
    write_manifest(root, ".claude-plugin/plugin.json")
    write_manifest(root, ".codex-plugin/plugin.json")


class ManifestValidationTests(unittest.TestCase):
    def test_valid_manifest_pair_passes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            root = Path(tmp_dir)
            write_valid_pair(root)

            self.assertEqual(validate(root), [])

    def test_name_mismatch_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            root = Path(tmp_dir)
            write_valid_pair(root)
            write_manifest(root, ".codex-plugin/plugin.json", name="ad-engineering")

            errors = validate(root)

        self.assertIn(
            ".codex-plugin/plugin.json: expected name 'engineering-skills', found 'ad-engineering'",
            errors,
        )
        self.assertIn("manifest mismatch: 'name' differs between Claude and Codex", errors)

    def test_codex_version_is_required(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            root = Path(tmp_dir)
            write_valid_pair(root)
            codex_path = root / ".codex-plugin/plugin.json"
            codex = json.loads(codex_path.read_text(encoding="utf-8"))
            del codex["version"]
            codex_path.write_text(json.dumps(codex), encoding="utf-8")

            errors = validate(root)

        self.assertIn(".codex-plugin/plugin.json: missing required field 'version'", errors)
        self.assertIn(".codex-plugin/plugin.json: version must be a semver string like 1.2.3", errors)

    def test_invalid_skills_path_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            root = Path(tmp_dir)
            write_valid_pair(root)
            write_manifest(root, ".codex-plugin/plugin.json", skills="./skill")

            errors = validate(root)

        self.assertIn(".codex-plugin/plugin.json: skills must point to './skills'", errors)

    def test_manifest_license_must_be_elv2(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            root = Path(tmp_dir)
            write_valid_pair(root)
            write_manifest(root, ".claude-plugin/plugin.json", license="MIT")

            errors = validate(root)

        self.assertIn(".claude-plugin/plugin.json: expected license 'ELv2', found 'MIT'", errors)
        self.assertIn("manifest mismatch: 'license' differs between Claude and Codex", errors)


if __name__ == "__main__":
    unittest.main()
