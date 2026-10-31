from __future__ import annotations

from datetime import date, datetime, time, timedelta

CHECK_IN_TIME = time(15, 0)

FULL_REFUND_NOTICE = timedelta(hours=48)
HALF_REFUND_NOTICE = timedelta(hours=24)


class CancellationError(Exception):
    pass


def check_in_at(start: date) -> datetime:
    return datetime.combine(start, CHECK_IN_TIME)


def refund_amount(total: int, start: date, now: datetime) -> int:
    """Refund in cents for a booking of ``total`` cents cancelled at ``now``."""
    notice = check_in_at(start) - now
    if notice <= timedelta(0):
        raise CancellationError("stay has already started")
    if notice >= FULL_REFUND_NOTICE:
        return total
    if notice >= HALF_REFUND_NOTICE:
        return (total + 1) // 2  # half a cent rounds up
    return 0
