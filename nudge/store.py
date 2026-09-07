"""In-memory store of appointments and their reminders."""

from __future__ import annotations

import itertools
import threading
from datetime import datetime, timedelta
from typing import Iterable

from nudge.clock import Clock, SystemClock
from nudge.models import CANCELLED, SCHEDULED, Appointment, Reminder
from nudge.schedule import DEFAULT_OFFSETS, plan_reminders


class ReminderStore:
    """Keeps appointments and the reminders planned for them.

    All public methods are safe to call from several threads.
    """

    def __init__(self, clock: Clock | None = None) -> None:
        self._clock = clock or SystemClock()
        self._lock = threading.RLock()
        self._ids = itertools.count(1)
        self._appointments: dict[str, Appointment] = {}
        self._reminders: dict[str, list[Reminder]] = {}

    # -- appointments -----------------------------------------------------

    def add(
        self,
        contact: str,
        name: str,
        start: datetime,
        offsets: Iterable[timedelta] = DEFAULT_OFFSETS,
        template: str = "default",
        series_id: str | None = None,
    ) -> Appointment:
        if start.tzinfo is None:
            raise ValueError("start must be timezone-aware")
        with self._lock:
            appt = Appointment(
                id=f"apt-{next(self._ids)}",
                contact=contact,
                name=name,
                start=start,
                offsets=tuple(offsets),
                template=template,
                series_id=series_id,
            )
            self._appointments[appt.id] = appt
            self._reminders[appt.id] = self._plan(appt)
            return appt

    def get(self, appointment_id: str) -> Appointment:
        with self._lock:
            return self._appointments[appointment_id]

    def reschedule(self, appointment_id: str, new_start: datetime) -> Appointment:
        with self._lock:
            appt = self._appointments[appointment_id]
            if appt.status != SCHEDULED:
                raise ValueError(f"cannot reschedule a {appt.status} appointment")
            appt.start = new_start
            self._reminders[appt.id].extend(self._plan(appt))
            return appt

    def cancel(self, appointment_id: str) -> Appointment:
        with self._lock:
            appt = self._appointments[appointment_id]
            appt.status = CANCELLED
            self._reminders[appt.id] = [r for r in self._reminders[appt.id] if r.sent]
            return appt

    # -- reminders --------------------------------------------------------

    def reminders(self, appointment_id: str) -> list[Reminder]:
        with self._lock:
            return list(self._reminders[appointment_id])

    def pending(self, appointment_id: str) -> list[Reminder]:
        return [r for r in self.reminders(appointment_id) if not r.sent]

    def due(self, now: datetime) -> list[Reminder]:
        with self._lock:
            found = [
                r
                for appt in self._appointments.values()
                if appt.status == SCHEDULED
                for r in self._reminders[appt.id]
                if not r.sent and r.at <= now
            ]
        return sorted(found, key=lambda r: r.at)

    def mark_sent(self, reminder: Reminder, message_id: str) -> None:
        with self._lock:
            reminder.sent = True
            reminder.message_id = message_id

    def _plan(self, appt: Appointment) -> list[Reminder]:
        return [
            Reminder(appointment_id=appt.id, offset=p.offset, at=p.at)
            for p in plan_reminders(appt.start, appt.offsets, now=self._clock.now())
        ]
