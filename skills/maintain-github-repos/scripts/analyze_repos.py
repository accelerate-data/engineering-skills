#!/usr/bin/env python3
"""
GitHub Repo Cleanup Analyzer
Applies tiered rules to identify repos that should be archived or deleted.

Rules:
  scratch repos:
    - No activity in any branch > 4 weeks  -> archive
    - Already archived > 8 weeks           -> delete

  dev repos:
    - No activity in any branch > 1 week   -> delete

  non-scratch repos:
    - > 2 weeks old AND empty/README-only across all branches -> delete
    - No activity in any branch > 12 weeks -> archive

Usage:
  python analyze_repos.py --org <org-name> [--dry-run]
"""

import subprocess, json, time, sys
from datetime import datetime, timedelta
from argparse import ArgumentParser
from urllib.parse import quote

ORG = "accelerate-data"  # default, overridable via --org

SCRATCH_ARCHIVE_WEEKS  = 4
SCRATCH_DELETE_WEEKS   = 8
DEV_DELETE_WEEKS = 1
NONSCRATCH_EMPTY_WEEKS = 2
NONSCRATCH_ARCHIVE_WEEKS = 12

NOISE_FILES = {"readme.md", "readme.txt", "readme", ".gitignore"}

def now():
    return datetime.now()

def cutoff_date(weeks):
    return (now() - timedelta(weeks=weeks)).strftime("%Y-%m-%d")

def gh_rest(path, retries=3, backoff=5):
    """Call the GitHub REST API via the gh CLI. Returns parsed JSON."""
    for attempt in range(retries):
        result = subprocess.run(
            ["gh", "api", path],
            capture_output=True, text=True
        )
        if result.returncode == 0:
            return json.loads(result.stdout)
        err = result.stderr.strip()
        if attempt < retries - 1:
            print(f"  Retry {attempt + 1}/{retries - 1}: {err}, waiting {backoff}s...")
            time.sleep(backoff)
        else:
            raise RuntimeError(f"REST API call failed after {retries} attempts: {err}")


def fetch_all_repos(org):
    """Fetch all repos (including archived) with branch commit dates and file trees.

    Uses the GitHub REST API exclusively to avoid the 502/504 instability of GraphQL.
    All branches are inspected for real content — analysis stops as soon as real
    content is found on any branch to minimise API round-trips.
    """
    repos = []
    page = 1

    while True:
        page_repos = gh_rest(f"/orgs/{org}/repos?per_page=100&page={page}&type=all")
        if not page_repos:
            break

        for repo in page_repos:
            repo_name = repo["name"]

            # Fetch up to 101 branches so we can detect the >100 truncation case.
            branches = gh_rest(f"/repos/{org}/{repo_name}/branches?per_page=101")
            branch_list_truncated = len(branches) > 100
            branches = branches[:100]

            latest_date = None
            latest_author = "-"
            all_files = set()
            has_real_content = False

            for branch in branches:
                branch_name = branch["name"]
                detail = gh_rest(f"/repos/{org}/{repo_name}/branches/{quote(branch_name, safe='')}")
                commit_inner = detail.get("commit", {}).get("commit", {})

                # Extract the commit date (prefer committer, fall back to author).
                raw_date = (
                    commit_inner.get("committer", {}).get("date")
                    or commit_inner.get("author", {}).get("date")
                    or ""
                )
                date = raw_date[:10]
                author = (
                    commit_inner.get("author", {}).get("name")
                    or commit_inner.get("committer", {}).get("name")
                    or "unknown"
                )

                if date and (latest_date is None or date > latest_date):
                    latest_date = date
                    latest_author = author

                # Only fetch the tree if we haven't found real content yet.
                if not has_real_content:
                    tree_sha = commit_inner.get("tree", {}).get("sha")
                    if tree_sha:
                        tree = gh_rest(f"/repos/{org}/{repo_name}/git/trees/{tree_sha}")
                        for entry in tree.get("tree", []):
                            name_lower = entry["path"].lower()
                            all_files.add(name_lower)
                            if name_lower not in NOISE_FILES:
                                has_real_content = True

            created_at = (repo.get("created_at") or "")[:10]
            repos.append({
                "name": repo_name,
                "is_archived": repo.get("archived", False),
                "created_at": created_at,
                "latest_commit": latest_date or "no commits",
                "latest_author": latest_author,
                "has_real_content": has_real_content,
                "all_files": sorted(all_files),
                "no_branches": len(branches) == 0,
                "branch_list_truncated": branch_list_truncated,
            })

        if len(page_repos) < 100:
            break
        page += 1

    return repos


def classify_repos(repos):
    """Apply cleanup rules and return categorised action lists."""
    to_delete  = []
    to_archive = []
    manual_review = []
    ok         = []

    c4  = cutoff_date(SCRATCH_ARCHIVE_WEEKS)
    c8  = cutoff_date(SCRATCH_DELETE_WEEKS)
    c1  = cutoff_date(DEV_DELETE_WEEKS)
    c2  = cutoff_date(NONSCRATCH_EMPTY_WEEKS)
    c12 = cutoff_date(NONSCRATCH_ARCHIVE_WEEKS)

    for r in repos:
        name       = r["name"]
        archived   = r["is_archived"]
        latest     = r["latest_commit"]
        created    = r["created_at"]
        is_scratch = name.startswith("scratch") or name.startswith("scratch_")
        is_dev      = name.startswith("dev")

        if r.get("branch_list_truncated"):
            manual_review.append({**r, "reason": "more than 100 branches; branch activity scan is incomplete"})
            continue

        if is_dev:
            # VibeData dev repo, no activity > 1 week -> delete
            if latest == "no commits" or latest < c1:
                to_delete.append({**r, "reason": f"VibeData dev repo, last activity {latest} (>{DEV_DELETE_WEEKS}w ago)"})
            else:
                ok.append(r)
        elif is_scratch:
            if archived:
                # Archived scratch repo older than 8 weeks -> delete
                if latest == "no commits" or latest < c8:
                    to_delete.append({**r, "reason": f"archived scratch repo, last activity {latest} (>{SCRATCH_DELETE_WEEKS}w ago)"})
                else:
                    ok.append(r)
            else:
                # Active scratch repo, no activity > 4 weeks -> archive
                if latest == "no commits" or latest < c4:
                    to_archive.append({**r, "reason": f"scratch repo, last activity {latest} (>{SCRATCH_ARCHIVE_WEEKS}w ago)"})
                else:
                    ok.append(r)
        else:
            if archived:
                ok.append(r)  # archived non-scratch: leave alone unless explicitly reviewed
                continue

            # Empty or README-only, repo older than 2 weeks -> delete
            if not r["has_real_content"] and created < c2:
                to_delete.append({**r, "reason": f"non-scratch, empty/README-only, created {created} (>{NONSCRATCH_EMPTY_WEEKS}w ago)"})
            # No activity > 12 weeks -> archive
            elif latest == "no commits" or latest < c12:
                to_archive.append({**r, "reason": f"non-scratch, last activity {latest} (>{NONSCRATCH_ARCHIVE_WEEKS}w ago)"})
            else:
                ok.append(r)

    return to_delete, to_archive, manual_review, ok


def print_summary(to_delete, to_archive, manual_review):
    print(f"\n{'='*70}")
    print(f"PROPOSED ACTIONS")
    print(f"{'='*70}")

    if to_delete:
        print(f"\n🗑  DELETE ({len(to_delete)} repos):")
        for r in sorted(to_delete, key=lambda x: x["latest_commit"]):
            archived_tag = " [archived]" if r["is_archived"] else ""
            print(f"  {r['name']:<45} {r['latest_commit']:<12} {r['latest_author']}{archived_tag}")
            print(f"    reason: {r['reason']}")
    else:
        print("\n🗑  DELETE: none")

    if to_archive:
        print(f"\n📦 ARCHIVE ({len(to_archive)} repos):")
        for r in sorted(to_archive, key=lambda x: x["latest_commit"]):
            print(f"  {r['name']:<45} {r['latest_commit']:<12} {r['latest_author']}")
            print(f"    reason: {r['reason']}")
    else:
        print("\n📦 ARCHIVE: none")

    if manual_review:
        print(f"\n🔎 MANUAL REVIEW ({len(manual_review)} repos):")
        for r in sorted(manual_review, key=lambda x: x["name"]):
            print(f"  {r['name']:<45} {r['latest_commit']:<12} {r['latest_author']}")
            print(f"    reason: {r['reason']}")
    else:
        print("\n🔎 MANUAL REVIEW: none")

    print(f"\n{'='*70}")
    print(f"Total: {len(to_delete)} to delete, {len(to_archive)} to archive, {len(manual_review)} for manual review")


def execute_actions(to_delete, to_archive, org, dry_run=False):
    tag = "[DRY RUN] " if dry_run else ""

    for r in to_archive:
        print(f"  {tag}Archiving {r['name']}...")
        if not dry_run:
            result = subprocess.run(
                ["gh", "repo", "archive", f"{org}/{r['name']}", "--yes"],
                capture_output=True, text=True
            )
            if result.returncode != 0:
                print(f"    ⚠ Failed: {result.stderr.strip()}")
            else:
                print(f"    ✓ Archived")

    for r in to_delete:
        print(f"  {tag}Deleting {r['name']}...")
        if not dry_run:
            result = subprocess.run(
                ["gh", "repo", "delete", f"{org}/{r['name']}", "--yes"],
                capture_output=True, text=True
            )
            if result.returncode != 0:
                print(f"    ⚠ Failed: {result.stderr.strip()}")
            else:
                print(f"    ✓ Deleted")


def main():
    parser = ArgumentParser(description="Analyze GitHub repos for cleanup")
    parser.add_argument("--org", default=ORG, help="GitHub org name")
    parser.add_argument("--dry-run", action="store_true", help="Show actions without executing")
    parser.add_argument("--execute", action="store_true", help="Execute archive/delete actions after confirmation")
    args = parser.parse_args()

    print(f"Fetching all repos from {args.org}...")
    repos = fetch_all_repos(args.org)
    print(f"  {len(repos)} repos fetched")

    to_delete, to_archive, manual_review, ok = classify_repos(repos)
    print_summary(to_delete, to_archive, manual_review)

    if not to_delete and not to_archive:
        print("\nNothing to do.")
        return

    if args.dry_run:
        print("\n(Dry run — no changes made)")
        return

    if args.execute:
        print("\nExecuting actions...")
        execute_actions(to_delete, to_archive, args.org)
        print("\nDone.")
    else:
        print("\nRun with --execute to apply these changes, or --dry-run to preview without changes.")


if __name__ == "__main__":
    main()
