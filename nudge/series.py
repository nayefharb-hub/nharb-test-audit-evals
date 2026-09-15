"""Recurring appointments."""

from __future__ import annotations

from datetime import datetime

from dateutil.relativedelta import relativedelta


def monthly_starts(first_start: datetime, count: int) -> list[datetime]:
    """Start times for ``count`` monthly occurrences beginning at ``first_start``.

    Every occurrence is computed from the first one, so an appointment on the
    31st lands on the last day of shorter months and returns to the 31st
    afterwards instead of drifting earlier.
    """
    if count < 1:
        raise ValueError("count must be at least 1")
    return [first_start + relativedelta(months=i) for i in range(count)]
