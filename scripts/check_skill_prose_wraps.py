#!/usr/bin/env python3
"""Detect hard-wrapped prose in skill Markdown files."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path


SKILL_MD_GLOB = "skills/**/*.md"
SENTENCE_END_RE = re.compile(r"""[.!?;:。！？；：)\]"'`>]$""")
LIST_RE = re.compile(r"^\s*(?:[-*+]|\d+[.)])\s+")
CONTINUATION_RE = re.compile(r"^\s{2,}\S")


@dataclass(frozen=True)
class Finding:
    path: Path
    line_number: int
    line: str
    next_line: str

    def format(self, root: Path) -> str:
        relative_path = self.path.relative_to(root)
        return (
            f"{relative_path}:{self.line_number}: possible hard-wrapped prose\n"
            f"  {self.line}\n"
            f"  {self.next_line}"
        )


def is_frontmatter_delimiter(line: str, line_number: int) -> bool:
    return line_number == 1 and line == "---"


def is_ignored_line(line: str) -> bool:
    stripped = line.strip()
    if not stripped:
        return True
    if stripped.startswith(("#", "|", ">", "<", "<!--")):
        return True
    if stripped in {"---", "***"}:
        return True
    if re.match(r"^\s*```", line):
        return True
    if re.match(r"^\s{4,}\S", line):
        return True
    if re.match(r"^\s*[-*+]\s+\[[ xX]\]", line):
        return True
    return False


def is_new_block(line: str) -> bool:
    stripped = line.lstrip()
    return bool(
        not stripped
        or stripped.startswith(("#", "|", ">", "<", "<!--"))
        or LIST_RE.match(line)
        or re.match(r"^\s*```", line)
        or re.match(r"^\s{4,}\S", line)
    )


def can_continue_sentence(line: str, next_line: str) -> bool:
    stripped = line.rstrip()
    next_stripped = next_line.lstrip()

    if is_ignored_line(stripped) or is_ignored_line(next_line):
        return False
    if is_new_block(next_line):
        return False
    if SENTENCE_END_RE.search(stripped):
        return False
    if stripped.endswith(("  ", "\\", "/", ",")):
        return False
    if re.search(r"https?://\S*$", stripped):
        return False
    if next_stripped.startswith(("and ", "or ", "but ", "then ", "with ", "for ", "to ")):
        return True
    if next_stripped and next_stripped[0].islower():
        return True
    if LIST_RE.match(line) and CONTINUATION_RE.match(next_line):
        return True
    return False


def reflow_file(path: Path) -> bool:
    lines = path.read_text(encoding="utf-8").splitlines()
    changed = False
    index = 0
    in_fence = False
    in_frontmatter = False

    while index < len(lines) - 1:
        line_number = index + 1
        stripped = lines[index].strip()

        if is_frontmatter_delimiter(stripped, line_number):
            in_frontmatter = True
            index += 1
            continue
        if in_frontmatter:
            if stripped == "---":
                in_frontmatter = False
            index += 1
            continue
        if re.match(r"^\s*```", lines[index]):
            in_fence = not in_fence
            index += 1
            continue
        if in_fence:
            index += 1
            continue

        if can_continue_sentence(lines[index], lines[index + 1]):
            lines[index] = f"{lines[index].rstrip()} {lines[index + 1].lstrip()}"
            del lines[index + 1]
            changed = True
            continue

        index += 1

    if changed:
        path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return changed


def findings_for_file(path: Path) -> list[Finding]:
    lines = path.read_text(encoding="utf-8").splitlines()
    findings: list[Finding] = []
    in_fence = False
    in_frontmatter = False

    for index, line in enumerate(lines[:-1]):
        line_number = index + 1
        stripped = line.strip()

        if is_frontmatter_delimiter(stripped, line_number):
            in_frontmatter = True
            continue
        if in_frontmatter:
            if stripped == "---":
                in_frontmatter = False
            continue
        if re.match(r"^\s*```", line):
            in_fence = not in_fence
            continue
        if in_fence:
            continue

        next_line = lines[index + 1]
        if can_continue_sentence(line, next_line):
            findings.append(Finding(path=path, line_number=line_number, line=line, next_line=next_line))

    return findings


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path.cwd(), help="repository root")
    parser.add_argument("--fix", action="store_true", help="reflow detected hard wraps in place")
    args = parser.parse_args(argv)
    root = args.root.resolve()

    if args.fix:
        changed_paths = []
        for path in sorted(root.glob(SKILL_MD_GLOB)):
            if path.is_file() and reflow_file(path):
                changed_paths.append(path)
        for path in changed_paths:
            print(f"Reflowed {path.relative_to(root)}")

    findings: list[Finding] = []
    for path in sorted(root.glob(SKILL_MD_GLOB)):
        if path.is_file():
            findings.extend(findings_for_file(path))

    if findings:
        print("Skill prose wrap check failed:", file=sys.stderr)
        print("Reflow prose so sentences are not split across Markdown lines.", file=sys.stderr)
        for finding in findings:
            print(f"- {finding.format(root)}", file=sys.stderr)
        return 1

    print("Skill prose wrap check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
