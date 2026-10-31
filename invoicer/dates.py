from __future__ import annotations

from datetime import date, datetime, timedelta, timezone


def due_date(issue_date: date, terms_days: int) -> date:
    return issue_date + timedelta(days=terms_days)


def is_overdue(invoice, today: date | None = None) -> bool:
    if today is None:
        today = datetime.now(timezone.utc).date()
    return today > invoice.due_date
