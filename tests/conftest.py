import threading
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import pytest

from nudge.dispatcher import Dispatcher
from nudge.store import ReminderStore
from nudge.templates import reset_templates

LONDON = ZoneInfo("Europe/London")


class FakeClock:
    """A clock that only moves when told to."""

    def __init__(self, start: datetime) -> None:
        self._now = start
        self._lock = threading.Lock()

    def now(self) -> datetime:
        with self._lock:
            return self._now

    def sleep(self, seconds: float) -> None:
        with self._lock:
            self._now += timedelta(seconds=seconds)


class RecordingGateway:
    """Stands in for the SMTP relay and remembers every message handed to it."""

    def __init__(self) -> None:
        self.sent = []
        self._cond = threading.Condition()

    def send(self, message) -> None:
        with self._cond:
            self.sent.append(message)
            self._cond.notify_all()

    def wait_for(self, count: int, timeout: float = 2.0) -> bool:
        with self._cond:
            return self._cond.wait_for(lambda: len(self.sent) >= count, timeout)


@pytest.fixture
def clock():
    # Monday 2 March 2026, 09:00 London time.
    return FakeClock(datetime(2026, 3, 2, 9, 0, tzinfo=LONDON))


@pytest.fixture
def store(clock):
    return ReminderStore(clock)


@pytest.fixture
def gateway():
    return RecordingGateway()


@pytest.fixture
def dispatcher(store, gateway, clock):
    return Dispatcher(store, gateway, clock)


@pytest.fixture
def clean_templates():
    reset_templates()
    yield
    reset_templates()
