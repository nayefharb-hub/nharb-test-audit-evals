"""Parsing of human-written durations such as ``24h`` or ``1h30m``."""

from __future__ import annotations

import re
from datetime import timedelta

_UNITS = {"d": 86400, "h": 3600, "m": 60, "s": 1}
_TOKEN = re.compile(r"(\d+)([dhms])")


def parse_duration(text: str) -> timedelta:
    """Parse a compact duration like ``2h``, ``1h30m`` or ``1d``.

    Units are ``d``, ``h``, ``m`` and ``s``; they may be combined, largest
    first or not. Whitespace around the value is ignored. Zero-length
    durations are rejected because a reminder offset of zero is meaningless.
    """
    cleaned = text.strip().lower()
    if not cleaned:
        raise ValueError("empty duration")
    pos = 0
    total = 0
    for match in _TOKEN.finditer(cleaned):
        if match.start() != pos:
            break
        total += int(match.group(1)) * _UNITS[match.group(2)]
        pos = match.end()
    if pos != len(cleaned):
        raise ValueError(f"invalid duration: {text!r}")
    if total == 0:
        raise ValueError(f"duration must be positive: {text!r}")
    return timedelta(seconds=total)


def parse_offsets(text: str) -> list[timedelta]:
    """Parse a comma-separated list of durations, e.g. ``"24h,2h"``."""
    parts = [p for p in text.split(",") if p.strip()]
    if not parts:
        raise ValueError("no offsets given")
    return [parse_duration(p) for p in parts]


def format_duration(value: timedelta) -> str:
    """Inverse of :func:`parse_duration` for display purposes."""
    seconds = int(value.total_seconds())
    out = []
    for unit, size in _UNITS.items():
        amount, seconds = divmod(seconds, size)
        if amount:
            out.append(f"{amount}{unit}")
    return "".join(out) or "0s"
