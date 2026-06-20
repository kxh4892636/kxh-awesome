#!/usr/bin/env python3
"""Resolve the current Codex handoff document path."""

from __future__ import annotations

import argparse
import json
import os
import subprocess
from pathlib import Path


def newest_index_session_id() -> str | None:
    index_path = Path.home() / ".codex" / "session_index.jsonl"
    if not index_path.is_file():
        return None

    try:
        lines = index_path.read_text(encoding="utf-8").splitlines()
    except OSError:
        return None

    for line in reversed(lines):
        if not line.strip():
            continue
        try:
            payload = json.loads(line)
        except json.JSONDecodeError:
            continue
        session_id = payload.get("id")
        if isinstance(session_id, str) and session_id.strip():
            return session_id.strip()
    return None


def resolve_session_id(explicit: str | None) -> str | None:
    if explicit and explicit.strip():
        return explicit.strip()

    for key in ("CODEX_SESSION_ID", "CODEX_THREAD_ID"):
        value = os.environ.get(key)
        if value and value.strip():
            return value.strip()

    return newest_index_session_id()


def project_root(cwd: str) -> Path:
    path = Path(cwd).resolve()
    try:
        result = subprocess.run(
            ["git", "-C", str(path), "rev-parse", "--show-toplevel"],
            check=True,
            capture_output=True,
            text=True,
            timeout=5,
        )
    except Exception:
        return path

    root = result.stdout.strip()
    return Path(root).resolve() if root else path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cwd", default=os.getcwd(), help="Project working directory.")
    parser.add_argument("--session-id", help="Known Codex session id.")
    parser.add_argument(
        "--print-path",
        action="store_true",
        help="Print only the resolved handoff path.",
    )
    args = parser.parse_args()

    session_id = resolve_session_id(args.session_id)
    if not session_id:
        raise SystemExit("Unable to resolve Codex session id.")

    cwd = project_root(args.cwd)
    handoff_path = cwd / "docs" / "handoff" / f"{session_id}.md"
    if args.print_path:
        print(handoff_path)
        return 0

    print(
        json.dumps(
            {
                "session_id": session_id,
                "handoff_path": str(handoff_path),
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
