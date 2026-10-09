"""Command line interface: ``python -m nudge``."""

from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from nudge.durations import format_duration, parse_duration, parse_offsets
from nudge.schedule import plan_reminders


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="nudge", description="Appointment reminder tools")
    sub = parser.add_subparsers(dest="command", required=True)

    plan = sub.add_parser("plan", help="show when reminders would go out")
    plan.add_argument("--start", required=True, help="local start time, e.g. 2026-03-10T08:30")
    plan.add_argument("--tz", default="UTC", help="IANA time zone of the appointment")
    plan.add_argument("--offsets", default="24h,2h", help="comma-separated, e.g. 24h,2h")
    plan.add_argument("--output", help="write the plan to this file instead of stdout")

    dur = sub.add_parser("parse-duration", help="print a duration in seconds")
    dur.add_argument("text")
    return parser


def _plan(args: argparse.Namespace) -> int:
    try:
        tz = ZoneInfo(args.tz)
    except (ZoneInfoNotFoundError, ValueError):
        print(f"nudge: unknown time zone {args.tz!r}", file=sys.stderr)
        return 2
    try:
        offsets = parse_offsets(args.offsets)
        start = datetime.fromisoformat(args.start).replace(tzinfo=tz)
    except ValueError as exc:
        print(f"nudge: {exc}", file=sys.stderr)
        return 2
    lines = [
        f"{format_duration(p.offset):>8}  {p.at.isoformat()}"
        for p in plan_reminders(start, offsets)
    ]
    text = "\n".join(lines) + "\n"
    if args.output:
        # Plans end up on shared machines; keep them readable by the owner only.
        fd = os.open(args.output, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        with os.fdopen(fd, "w") as fh:
            fh.write(text)
        os.chmod(args.output, 0o600)
    else:
        sys.stdout.write(text)
    return 0


def _parse_duration(args: argparse.Namespace) -> int:
    try:
        value = parse_duration(args.text)
    except ValueError as exc:
        print(f"nudge: {exc}", file=sys.stderr)
        return 2
    print(int(value.total_seconds()))
    return 0


def main(argv: list[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)
    if args.command == "plan":
        return _plan(args)
    return _parse_duration(args)
