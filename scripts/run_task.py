#!/usr/bin/env python3
"""Entry point for Claude Code remote automation tasks."""

import json
import os
import sys
from datetime import date
from pathlib import Path

TASKS = {
    "generate-script",
    "create-metadata",
    "analyze-channel",
    "bulk-update-descriptions",
}


def load_triggers() -> list[dict]:
    triggers_path = Path(__file__).parent.parent / ".claude" / "triggers.json"
    with open(triggers_path) as f:
        return json.load(f)["triggers"]


def run_task(task: str, topic: str, dry_run: bool) -> None:
    triggers = load_triggers()
    trigger = next((t for t in triggers if t["id"] == task), None)
    if trigger is None:
        print(f"Unknown task: {task}. Available: {', '.join(TASKS)}")
        sys.exit(1)

    print(f"[{date.today()}] Task  : {trigger['name']}")
    print(f"[{date.today()}] Topic : {topic or '(none)'}")
    print(f"[{date.today()}] Prompt: {trigger['prompt']}")
    print(f"[{date.today()}] Dry run: {dry_run}")

    logs_dir = Path(__file__).parent.parent / "logs"
    logs_dir.mkdir(exist_ok=True)
    log_file = logs_dir / f"{task}_{date.today()}.log"
    log_file.write_text(
        f"task={task}\ntopic={topic}\ndry_run={dry_run}\nprompt={trigger['prompt']}\n"
    )
    print(f"Logged to {log_file}")

    if dry_run:
        print("Dry run — no changes applied.")
    else:
        print("Execute task via Claude Code or the relevant script here.")


if __name__ == "__main__":
    task_arg = sys.argv[1] if len(sys.argv) > 1 else "analyze-channel"
    topic_arg = sys.argv[2] if len(sys.argv) > 2 else ""
    dry_run_arg = (sys.argv[3] if len(sys.argv) > 3 else "true").lower() != "false"
    run_task(task_arg, topic_arg, dry_run_arg)
