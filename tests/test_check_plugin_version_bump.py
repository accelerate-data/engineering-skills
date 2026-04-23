from __future__ import annotations

import unittest

from scripts.check_plugin_version_bump import parse_semver


class VersionBumpTests(unittest.TestCase):
    def test_parse_semver(self) -> None:
        self.assertEqual(parse_semver("1.2.3"), (1, 2, 3))

    def test_parse_semver_rejects_non_semver(self) -> None:
        with self.assertRaises(ValueError):
            parse_semver("1.2")


if __name__ == "__main__":
    unittest.main()
