#!/usr/bin/env python3
"""Inject Plan Handoff context on Codex SessionStart events."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path
from typing import Any


def read_input() -> dict[str, Any]:
    try:
        raw = sys.stdin.read()
        if not raw.strip():
            return {}
        payload = json.loads(raw)
        return payload if isinstance(payload, dict) else {}
    except Exception:
        return {}


def emit_context(context: str) -> None:
    sys.stdout.write(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "SessionStart",
                    "additionalContext": context,
                }
            },
            ensure_ascii=False,
        )
    )


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


def handoff_path(cwd: str, session_id: str) -> Path:
    return project_root(cwd) / "docs" / "handoff" / f"{session_id}.md"


def startup_context(cwd: str, session_id: str) -> str:
    path = handoff_path(cwd, session_id)
    return "\n".join(
        [
            "Plan Handoff plugin context:",
            f"- Current Codex session_id: {session_id}",
            f"- Current handoff document path: {path}",
            "- If the user invokes the to-plan skill, you must generate a TaskList based on task dependencies.",
            "- When the handoff skill is used, create or update the handoff document at the path above.",
        ]
    )


def compact_context(cwd: str, session_id: str) -> str | None:
    path = handoff_path(cwd, session_id)
    if not path.is_file():
        return None

    try:
        document = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        document = path.read_text(encoding="utf-8-sig")
    except OSError:
        return None

    return "\n".join(
        [
            "Plan Handoff compact context:",
            "You must immediately use the handoff skill and read the handoff document.",
            "After any TaskList task is completed, update the handoff document.",
            f"Current Codex session_id: {session_id}",
            f"Handoff document path: {path}",
            "",
            "<handoff_document>",
            document.rstrip(),
            "</handoff_document>",
        ]
    )


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")

    payload = read_input()
    source = str(payload.get("source") or "")
    cwd = str(payload.get("cwd") or Path.cwd())
    session_id = str(payload.get("session_id") or "").strip()
    if not session_id:
        return 0

    context = None
    if source == "startup":
        context = startup_context(cwd, session_id)
    elif source == "compact":
        context = compact_context(cwd, session_id)

    if context:
        emit_context(context)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
