"""Plain data objects."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta

SCHEDULED = "scheduled"
CANCELLED = "cancelled"


@dataclass
class Appointment:
    id: str
    contact: str
    name: str
    start: datetime
    offsets: tuple[timedelta, ...]
    template: str = "default"
    status: str = SCHEDULED
    series_id: str | None = None


@dataclass
class Reminder:
    appointment_id: str
    offset: timedelta
    at: datetime
    sent: bool = False
    message_id: str | None = field(default=None)
