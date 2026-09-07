"""Working out when reminders should go out."""

from __future__ import annotations

from datetime import datetime, time, timedelta
from typing import Iterable, NamedTuple

DEFAULT_OFFSETS = (timedelta(hours=24), timedelta(hours=2))

QUIET_START = time(22, 0)
QUIET_END = time(7, 0)
EVENING_SLOT = time(21, 0)


class PlannedReminder(NamedTuple):
    offset: timedelta
    at: datetime


def in_quiet_hours(t: time) -> bool:
    """True if a reminder at local time ``t`` would disturb someone."""
    return t >= QUIET_START or t <= QUIET_END


def shift_out_of_quiet_hours(at: datetime) -> datetime:
    """Move a reminder that falls in quiet hours to the evening before."""
    if not in_quiet_hours(at.time()):
        return at
    day = at.date()
    if at.time() < QUIET_START:
        # Small hours: the "evening before" is the previous calendar day.
        day -= timedelta(days=1)
    return datetime.combine(day, EVENING_SLOT, tzinfo=at.tzinfo)


def plan_reminders(
    start: datetime,
    offsets: Iterable[timedelta] = DEFAULT_OFFSETS,
    now: datetime | None = None,
) -> list[PlannedReminder]:
    """Return the reminders for an appointment at ``start``, earliest first.

    Each offset is subtracted from the start time, the result is moved out of
    quiet hours, and anything at or before ``now`` is dropped. Two offsets
    that end up at the same moment produce a single reminder (the larger
    offset wins).
    """
    if start.tzinfo is None:
        raise ValueError("start must be timezone-aware")
    planned: dict[datetime, PlannedReminder] = {}
    for offset in sorted(set(offsets), reverse=True):
        if offset <= timedelta(0):
            raise ValueError(f"offset must be positive: {offset}")
        at = shift_out_of_quiet_hours(start - offset)
        if now is not None and at <= now:
            continue
        planned.setdefault(at, PlannedReminder(offset, at))
    return sorted(planned.values(), key=lambda p: p.at)
