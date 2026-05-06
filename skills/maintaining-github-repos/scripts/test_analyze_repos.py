"""
Tests for analyze_repos.py — TDD suite covering the REST migration and content-check fix.

All tests mock `gh_rest` so no real GitHub API calls are made.
"""

import unittest
from unittest.mock import patch, call
import analyze_repos


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_branch_detail(branch_name, date, author, tree_sha):
    """Return a dict that mirrors the /repos/{org}/{repo}/branches/{branch} REST response."""
    return {
        "name": branch_name,
        "commit": {
            "sha": "abc123",
            "commit": {
                "author": {"name": author, "date": f"{date}T12:00:00Z"},
                "committer": {"name": author, "date": f"{date}T12:00:00Z"},
                "tree": {"sha": tree_sha},
            },
        },
    }


def make_tree(entries):
    """Return a dict mirroring the /repos/{org}/{repo}/git/trees/{sha} REST response.

    entries: list of (path, type) tuples, e.g. [("README.md", "blob")]
    """
    return {
        "tree": [{"path": p, "type": t, "sha": "x"} for p, t in entries]
    }


def make_repos_page(names, archived=False, created_at="2020-01-01T00:00:00Z"):
    return [
        {"name": n, "archived": archived, "created_at": created_at}
        for n in names
    ]


# ---------------------------------------------------------------------------
# 1. REST replaces GraphQL
# ---------------------------------------------------------------------------

class TestNoGraphQL(unittest.TestCase):
    def test_gh_graphql_does_not_exist(self):
        """The module must not expose a gh_graphql function after the migration."""
        self.assertFalse(
            hasattr(analyze_repos, "gh_graphql"),
            "gh_graphql should have been removed; REST endpoints are used instead",
        )

    def test_gh_rest_exists(self):
        """A gh_rest function must be present as the replacement."""
        self.assertTrue(
            hasattr(analyze_repos, "gh_rest"),
            "gh_rest must exist as the REST API helper",
        )


# ---------------------------------------------------------------------------
# 2. Content check: real content only on non-default branch
# ---------------------------------------------------------------------------

class TestContentCheckAcrossBranches(unittest.TestCase):

    @patch("analyze_repos.gh_rest")
    def test_real_content_on_non_default_branch_not_flagged_empty(self, mock_rest):
        """A repo whose default branch is README-only but has code on another branch
        must have has_real_content=True (AC: non-default branch real content check)."""

        def rest_router(path, **kwargs):
            if "/repos?" in path or "repos?per_page" in path:
                return make_repos_page(["myrepo"])
            if path.endswith("/branches?per_page=101"):
                return [{"name": "main"}, {"name": "feature"}]
            if path.endswith("/branches/main"):
                return make_branch_detail("main", "2026-01-01", "Alice", "tree-main")
            if path.endswith("/branches/feature"):
                return make_branch_detail("feature", "2026-01-02", "Bob", "tree-feat")
            if "tree-main" in path:
                return make_tree([("README.md", "blob")])
            if "tree-feat" in path:
                return make_tree([("app.py", "blob")])
            return []

        mock_rest.side_effect = rest_router
        repos = analyze_repos.fetch_all_repos("testorg")

        self.assertEqual(len(repos), 1)
        self.assertTrue(
            repos[0]["has_real_content"],
            "has_real_content should be True when code exists on any branch",
        )

    @patch("analyze_repos.gh_rest")
    def test_noise_only_across_all_branches_flagged_empty(self, mock_rest):
        """A repo where every branch contains only noise files must have has_real_content=False."""

        def rest_router(path, **kwargs):
            if "/repos?" in path or "repos?per_page" in path:
                return make_repos_page(["myrepo"])
            if path.endswith("/branches?per_page=101"):
                return [{"name": "main"}, {"name": "docs"}]
            if path.endswith("/branches/main"):
                return make_branch_detail("main", "2026-01-01", "Alice", "tree-main")
            if path.endswith("/branches/docs"):
                return make_branch_detail("docs", "2026-01-02", "Bob", "tree-docs")
            if "tree-main" in path:
                return make_tree([("README.md", "blob"), (".gitignore", "blob")])
            if "tree-docs" in path:
                return make_tree([("readme.txt", "blob")])
            return []

        mock_rest.side_effect = rest_router
        repos = analyze_repos.fetch_all_repos("testorg")

        self.assertEqual(len(repos), 1)
        self.assertFalse(
            repos[0]["has_real_content"],
            "has_real_content should be False when only noise files exist on all branches",
        )

    @patch("analyze_repos.gh_rest")
    def test_early_exit_once_real_content_found(self, mock_rest):
        """Once a branch with real content is found, tree fetches for remaining branches are skipped."""
        tree_calls = []

        def rest_router(path, **kwargs):
            if "/repos?" in path or "repos?per_page" in path:
                return make_repos_page(["myrepo"])
            if path.endswith("/branches?per_page=101"):
                return [{"name": "first"}, {"name": "second"}]
            if path.endswith("/branches/first"):
                return make_branch_detail("first", "2026-01-01", "Alice", "tree-first")
            if path.endswith("/branches/second"):
                return make_branch_detail("second", "2026-01-02", "Bob", "tree-second")
            if "tree-first" in path:
                tree_calls.append("first")
                return make_tree([("app.py", "blob")])
            if "tree-second" in path:
                tree_calls.append("second")
                return make_tree([("other.py", "blob")])
            return []

        mock_rest.side_effect = rest_router
        repos = analyze_repos.fetch_all_repos("testorg")

        self.assertTrue(repos[0]["has_real_content"])
        self.assertNotIn(
            "second",
            tree_calls,
            "Tree for 'second' branch should not be fetched once real content found on 'first'",
        )


# ---------------------------------------------------------------------------
# 3. Branch-list truncation safeguard
# ---------------------------------------------------------------------------

class TestBranchTruncation(unittest.TestCase):

    @patch("analyze_repos.gh_rest")
    def test_more_than_100_branches_sets_truncated_flag(self, mock_rest):
        """When the branch list response has >100 entries (we fetch 101), the repo
        must be marked branch_list_truncated=True and routed to manual review."""
        over_100_branches = [{"name": f"branch-{i}"} for i in range(101)]

        def rest_router(path, **kwargs):
            if "/repos?" in path or "repos?per_page" in path:
                return make_repos_page(["bigmono"])
            if path.endswith("/branches?per_page=101"):
                return over_100_branches
            # Branch details and trees won't be called for truncated repos
            return {}

        mock_rest.side_effect = rest_router
        repos = analyze_repos.fetch_all_repos("testorg")

        self.assertEqual(len(repos), 1)
        self.assertTrue(
            repos[0]["branch_list_truncated"],
            "branch_list_truncated must be True when >100 branches are returned",
        )

    @patch("analyze_repos.gh_rest")
    def test_exactly_100_branches_not_truncated(self, mock_rest):
        """Exactly 100 branches (the limit) must NOT set branch_list_truncated."""
        exactly_100 = [{"name": f"branch-{i}"} for i in range(100)]

        def rest_router(path, **kwargs):
            if "/repos?" in path or "repos?per_page" in path:
                return make_repos_page(["mediumrepo"])
            if path.endswith("/branches?per_page=101"):
                return exactly_100
            if "/branches/" in path:
                branch_name = path.split("/branches/")[-1]
                return make_branch_detail(branch_name, "2026-01-01", "Dev", f"tree-{branch_name}")
            if "/git/trees/" in path:
                return make_tree([("README.md", "blob")])
            return []

        mock_rest.side_effect = rest_router
        repos = analyze_repos.fetch_all_repos("testorg")

        self.assertFalse(
            repos[0]["branch_list_truncated"],
            "branch_list_truncated must be False when exactly 100 branches returned",
        )

    def test_truncated_repos_go_to_manual_review(self):
        """classify_repos routes branch_list_truncated repos to manual_review."""
        repo = {
            "name": "bigmono",
            "is_archived": False,
            "created_at": "2020-01-01",
            "latest_commit": "2026-01-01",
            "latest_author": "Dev",
            "has_real_content": True,
            "all_files": [],
            "no_branches": False,
            "branch_list_truncated": True,
        }
        to_delete, to_archive, manual_review, ok = analyze_repos.classify_repos([repo])
        self.assertEqual(len(manual_review), 1)
        self.assertEqual(manual_review[0]["name"], "bigmono")
        self.assertEqual(len(to_delete) + len(to_archive) + len(ok), 0)


# ---------------------------------------------------------------------------
# 4. Latest-commit tracking across all branches
# ---------------------------------------------------------------------------

class TestLatestCommitTracking(unittest.TestCase):

    @patch("analyze_repos.gh_rest")
    def test_latest_commit_date_and_author_from_newest_branch(self, mock_rest):
        """latest_commit and latest_author must reflect the most recent commit
        across all branches, not just the default branch."""

        def rest_router(path, **kwargs):
            if "/repos?" in path or "repos?per_page" in path:
                return make_repos_page(["myrepo"])
            if path.endswith("/branches?per_page=101"):
                return [{"name": "main"}, {"name": "hotfix"}]
            if path.endswith("/branches/main"):
                return make_branch_detail("main", "2025-06-01", "OldDev", "tree-main")
            if path.endswith("/branches/hotfix"):
                return make_branch_detail("hotfix", "2026-03-15", "NewDev", "tree-hotfix")
            if "/git/trees/" in path:
                return make_tree([("README.md", "blob")])
            return []

        mock_rest.side_effect = rest_router
        repos = analyze_repos.fetch_all_repos("testorg")

        self.assertEqual(repos[0]["latest_commit"], "2026-03-15")
        self.assertEqual(repos[0]["latest_author"], "NewDev")


# ---------------------------------------------------------------------------
# 5. Repo pagination
# ---------------------------------------------------------------------------

class TestRepoPagination(unittest.TestCase):

    @patch("analyze_repos.gh_rest")
    def test_multiple_pages_of_repos_all_fetched(self, mock_rest):
        """When the org has >100 repos, all pages must be fetched and concatenated."""
        page1 = make_repos_page([f"repo-{i}" for i in range(100)])
        page2 = make_repos_page(["repo-100", "repo-101"])

        def rest_router(path, **kwargs):
            # Use /orgs/ prefix to distinguish org-repo-listing calls from repo-level calls.
            if "/orgs/" in path and "&page=1&" in path:
                return page1
            if "/orgs/" in path and "&page=2&" in path:
                return page2
            if "/branches?per_page=101" in path:
                return [{"name": "main"}]
            if "/branches/main" in path:
                return make_branch_detail("main", "2026-01-01", "Dev", "tree1")
            if "/git/trees/" in path:
                return make_tree([("README.md", "blob")])
            return []

        mock_rest.side_effect = rest_router
        repos = analyze_repos.fetch_all_repos("testorg")

        self.assertEqual(len(repos), 102, "All 102 repos across two pages should be fetched")

    @patch("analyze_repos.gh_rest")
    def test_single_page_org_fetched_correctly(self, mock_rest):
        """An org with <100 repos should stop after the first page."""
        page1 = make_repos_page(["alpha", "beta"])

        def rest_router(path, **kwargs):
            if "/orgs/" in path and "&page=1&" in path:
                return page1
            if "/orgs/" in path and "&page=2&" in path:
                raise AssertionError("Second page should not be fetched for a small org")
            if "/branches?per_page=101" in path:
                return [{"name": "main"}]
            if "/branches/main" in path:
                return make_branch_detail("main", "2026-01-01", "Dev", "tree1")
            if "/git/trees/" in path:
                return make_tree([("README.md", "blob")])
            return []

        mock_rest.side_effect = rest_router
        repos = analyze_repos.fetch_all_repos("testorg")
        self.assertEqual(len(repos), 2)


# ---------------------------------------------------------------------------
# 6. classify_repos unchanged for non-empty, non-truncated repos
# ---------------------------------------------------------------------------

class TestClassifyReposUnchanged(unittest.TestCase):

    def _repo(self, **overrides):
        base = {
            "name": "myrepo",
            "is_archived": False,
            "created_at": "2020-01-01",
            "latest_commit": "2020-01-01",
            "latest_author": "Dev",
            "has_real_content": False,
            "all_files": [],
            "no_branches": False,
            "branch_list_truncated": False,
        }
        base.update(overrides)
        return base

    def test_empty_old_non_scratch_to_delete(self):
        """Non-scratch repo, empty/README-only, older than 2 weeks → delete."""
        repo = self._repo(has_real_content=False, created_at="2020-01-01")
        to_delete, to_archive, manual_review, ok = analyze_repos.classify_repos([repo])
        self.assertEqual(len(to_delete), 1)
        self.assertIn("empty/README-only", to_delete[0]["reason"])

    def test_repo_with_real_content_and_recent_activity_is_ok(self):
        """A healthy repo must not be flagged."""
        from datetime import datetime, timedelta
        recent = (datetime.now() - timedelta(weeks=1)).strftime("%Y-%m-%d")
        repo = self._repo(has_real_content=True, latest_commit=recent)
        to_delete, to_archive, manual_review, ok = analyze_repos.classify_repos([repo])
        self.assertEqual(len(ok), 1)
        self.assertEqual(len(to_delete) + len(to_archive) + len(manual_review), 0)


# ---------------------------------------------------------------------------
# 7. Branch name URL encoding
# ---------------------------------------------------------------------------

class TestBranchNameEncoding(unittest.TestCase):

    @patch("analyze_repos.gh_rest")
    def test_branch_with_slash_in_name_is_url_encoded(self, mock_rest):
        """Branch names like 'feature/my-branch' must be URL-encoded in the REST path
        so the API sees them as a single path segment, not nested resources."""
        calls = []

        def rest_router(path, **kwargs):
            calls.append(path)
            if "/orgs/" in path:
                return make_repos_page(["myrepo"])
            if "/branches?per_page=101" in path:
                return [{"name": "feature/my-branch"}]
            if "/branches/feature%2Fmy-branch" in path:
                return make_branch_detail("feature/my-branch", "2026-01-01", "Dev", "tree1")
            if "/git/trees/" in path:
                return make_tree([("README.md", "blob")])
            return {}

        mock_rest.side_effect = rest_router
        analyze_repos.fetch_all_repos("testorg")

        branch_detail_calls = [c for c in calls if "/branches/" in c and "per_page" not in c]
        self.assertTrue(
            any("%2F" in c for c in branch_detail_calls),
            f"Expected URL-encoded slash (%2F) in branch detail call, got: {branch_detail_calls}",
        )


# ---------------------------------------------------------------------------
# 8. Graceful 404 handling for branch detail
# ---------------------------------------------------------------------------

class TestBranchDetailNotFound(unittest.TestCase):

    @patch("analyze_repos.gh_rest")
    def test_branch_returning_404_is_skipped_not_crashed(self, mock_rest):
        """If a branch detail returns None (404), the branch should be skipped
        without crashing. The repo should still be returned with data from other branches."""

        def rest_router(path, **kwargs):
            if "/orgs/" in path:
                return make_repos_page(["myrepo"])
            if "/branches?per_page=101" in path:
                return [{"name": "main"}, {"name": "feature%2Fgone"}]
            if "/branches/main" in path:
                return make_branch_detail("main", "2026-01-01", "Alice", "tree-main")
            if "/branches/feature%252Fgone" in path or "/branches/feature%2Fgone" in path:
                # Simulate 404 — gh_rest returns None for not-found branches
                return None
            if "/git/trees/" in path:
                return make_tree([("README.md", "blob")])
            return {}

        mock_rest.side_effect = rest_router
        # Should complete without raising RuntimeError
        repos = analyze_repos.fetch_all_repos("testorg")
        self.assertEqual(len(repos), 1)
        # Data from the surviving branch is still present
        self.assertEqual(repos[0]["latest_commit"], "2026-01-01")

    @patch("analyze_repos.gh_rest")
    def test_all_branches_404_results_in_no_commits(self, mock_rest):
        """A repo where every branch detail 404s should show 'no commits'."""

        def rest_router(path, **kwargs):
            if "/orgs/" in path:
                return make_repos_page(["ghostrepo"])
            if "/branches?per_page=101" in path:
                return [{"name": "main"}]
            if "/branches/main" in path:
                return None  # 404
            return {}

        mock_rest.side_effect = rest_router
        repos = analyze_repos.fetch_all_repos("testorg")
        self.assertEqual(repos[0]["latest_commit"], "no commits")
        self.assertFalse(repos[0]["has_real_content"])


# ---------------------------------------------------------------------------
# 9. all_files completeness
# ---------------------------------------------------------------------------

class TestAllFilesCompleteness(unittest.TestCase):

    @patch("analyze_repos.gh_rest")
    def test_all_files_contains_all_root_entries_even_after_real_content_found(self, mock_rest):
        """all_files must include every entry from the inspected tree, not just those
        seen before the first non-noise file. The early-exit should only gate whether
        the tree is fetched at all — not cut short the entry scan mid-tree."""

        def rest_router(path, **kwargs):
            if "/orgs/" in path:
                return make_repos_page(["myrepo"])
            if "/branches?per_page=101" in path:
                return [{"name": "main"}]
            if "/branches/main" in path:
                return make_branch_detail("main", "2026-01-01", "Dev", "tree1")
            if "/git/trees/" in path:
                # Real file appears first, noise files appear after
                return make_tree([("app.py", "blob"), ("README.md", "blob"), (".gitignore", "blob")])
            return []

        mock_rest.side_effect = rest_router
        repos = analyze_repos.fetch_all_repos("testorg")

        all_files = set(repos[0]["all_files"])
        self.assertIn("app.py", all_files, "app.py should be in all_files")
        self.assertIn("readme.md", all_files, "README.md (lowercased) should be in all_files")
        self.assertIn(".gitignore", all_files, ".gitignore should be in all_files")


# ---------------------------------------------------------------------------
# 10. Partial execution modes
# ---------------------------------------------------------------------------

class TestPartialExecutionModes(unittest.TestCase):

    def _repo(self, name):
        return {
            "name": name,
            "is_archived": False,
            "created_at": "2020-01-01",
            "latest_commit": "2026-01-01",
            "latest_author": "Dev",
            "has_real_content": True,
            "all_files": [],
            "no_branches": False,
            "branch_list_truncated": False,
            "reason": "test reason",
        }

    @patch("analyze_repos.execute_actions")
    @patch("analyze_repos.classify_repos")
    @patch("analyze_repos.fetch_all_repos")
    @patch("sys.argv", ["analyze_repos.py", "--org", "testorg", "--execute", "--archive-only"])
    def test_execute_archive_only_skips_delete_actions(self, mock_fetch, mock_classify, mock_execute):
        delete_repo = self._repo("delete-me")
        archive_repo = self._repo("archive-me")
        mock_fetch.return_value = [delete_repo, archive_repo]
        mock_classify.return_value = ([delete_repo], [archive_repo], [], [])

        analyze_repos.main()

        mock_execute.assert_called_once_with([], [archive_repo], "testorg")

    @patch("analyze_repos.execute_actions")
    @patch("analyze_repos.classify_repos")
    @patch("analyze_repos.fetch_all_repos")
    @patch("sys.argv", ["analyze_repos.py", "--org", "testorg", "--execute", "--delete-only"])
    def test_execute_delete_only_skips_archive_actions(self, mock_fetch, mock_classify, mock_execute):
        delete_repo = self._repo("delete-me")
        archive_repo = self._repo("archive-me")
        mock_fetch.return_value = [delete_repo, archive_repo]
        mock_classify.return_value = ([delete_repo], [archive_repo], [], [])

        analyze_repos.main()

        mock_execute.assert_called_once_with([delete_repo], [], "testorg")

    @patch("analyze_repos.execute_actions")
    @patch("analyze_repos.classify_repos")
    @patch("analyze_repos.fetch_all_repos")
    @patch(
        "sys.argv",
        [
            "analyze_repos.py",
            "--org",
            "testorg",
            "--execute",
            "--delete-repo",
            "delete-one",
            "--delete-repo",
            "delete-two",
        ],
    )
    def test_execute_delete_repo_cherry_picks_named_delete_actions(
        self, mock_fetch, mock_classify, mock_execute
    ):
        delete_one = self._repo("delete-one")
        delete_two = self._repo("delete-two")
        delete_three = self._repo("delete-three")
        archive_repo = self._repo("archive-me")
        mock_fetch.return_value = [delete_one, delete_two, delete_three, archive_repo]
        mock_classify.return_value = (
            [delete_one, delete_two, delete_three],
            [archive_repo],
            [],
            [],
        )

        analyze_repos.main()

        mock_execute.assert_called_once_with([delete_one, delete_two], [], "testorg")

    @patch("analyze_repos.execute_actions")
    @patch("analyze_repos.classify_repos")
    @patch("analyze_repos.fetch_all_repos")
    @patch(
        "sys.argv",
        [
            "analyze_repos.py",
            "--org",
            "testorg",
            "--execute",
            "--delete-repo",
            "not-proposed",
        ],
    )
    def test_execute_delete_repo_rejects_names_not_in_delete_list(
        self, mock_fetch, mock_classify, mock_execute
    ):
        delete_repo = self._repo("delete-me")
        mock_fetch.return_value = [delete_repo]
        mock_classify.return_value = ([delete_repo], [], [], [])

        with self.assertRaises(SystemExit) as raised:
            analyze_repos.main()

        self.assertEqual(raised.exception.code, 2)
        mock_execute.assert_not_called()


if __name__ == "__main__":
    unittest.main()
