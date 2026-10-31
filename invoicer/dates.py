from __future__ import annotations

from datetime import date, datetime, timedelta, timezone


SATURDAY, SUNDAY = 5, 6


def due_date(issue_date: date, terms_days: int) -> date:
    """Issue date plus payment terms; weekends roll forward to Monday."""
    due = issue_date + timedelta(days=terms_days)
    if due.weekday() == SATURDAY:
        due += timedelta(days=2)
    elif due.weekday() == SUNDAY:
        due += timedelta(days=1)
    return due


def is_overdue(invoice, today: date | None = None) -> bool:
    if today is None:
        today = datetime.now(timezone.utc).date()
    return today > invoice.due_date
