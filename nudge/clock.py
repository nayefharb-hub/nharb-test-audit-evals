"""Clock abstraction so callers can control what "now" means."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Protocol


class Clock(Protocol):
    def now(self) -> datetime: ...


class SystemClock:
    """The real wall clock, always timezone-aware (UTC)."""

    def now(self) -> datetime:
        return datetime.now(timezone.utc)
