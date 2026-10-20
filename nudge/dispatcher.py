"""Sending reminders when they fall due."""

from __future__ import annotations

import logging
import threading

from nudge.clock import Clock
from nudge.gateway import EmailGateway
from nudge.store import ReminderStore
from nudge.templates import render_reminder

log = logging.getLogger(__name__)


class Dispatcher:
    def __init__(self, store: ReminderStore, gateway: EmailGateway, clock: Clock) -> None:
        self.store = store
        self.gateway = gateway
        self.clock = clock

    def tick(self) -> int:
        """Send every reminder that is due now. Returns how many were sent."""
        due = self.store.due(self.clock.now())
        # Mark everything as sent before talking to the gateway, so a slow
        # gateway can't let the next tick pick the same reminders up again.
        outgoing = []
        for reminder in due:
            appt = self.store.get(reminder.appointment_id)
            message = render_reminder(appt, reminder)
            self.store.mark_sent(reminder, message.message_id)
            outgoing.append(lambda: self.gateway.send(message))
        for send in outgoing:
            send()
        return len(outgoing)


class BackgroundRunner:
    """Calls :meth:`Dispatcher.tick` on a background thread."""

    def __init__(self, dispatcher: Dispatcher, poll_interval: float = 30.0) -> None:
        self.dispatcher = dispatcher
        self.poll_interval = poll_interval
        self._stop = threading.Event()
        self._thread: threading.Thread | None = None

    def start(self) -> None:
        if self._thread is not None:
            raise RuntimeError("runner already started")
        self._thread = threading.Thread(target=self._run, name="nudge-runner", daemon=True)
        self._thread.start()

    def stop(self, timeout: float = 5.0) -> None:
        self._stop.set()
        if self._thread is not None:
            self._thread.join(timeout)

    def _run(self) -> None:
        while not self._stop.is_set():
            try:
                self.dispatcher.tick()
            except Exception:
                log.exception("reminder dispatch failed")
            self._stop.wait(self.poll_interval)
