import time
from datetime import datetime

import pytest

from nudge.dispatcher import BackgroundRunner

from conftest import LONDON


def test_runner_sends_a_due_reminder_only_once(store, gateway, dispatcher, clock):
    store.add("ana@example.com", "Check-up", datetime(2026, 3, 3, 11, 0, tzinfo=LONDON))
    clock.sleep(2 * 3600)
    runner = BackgroundRunner(dispatcher, poll_interval=0.05)

    runner.start()
    try:
        assert gateway.wait_for(1)
        # Nothing to wait *for* here: we want to see that no second message
        # turns up. The gateway records every send, and 0.3s is six polls.
        time.sleep(0.3)
    finally:
        runner.stop()

    assert len(gateway.sent) == 1


def test_runner_picks_up_a_due_reminder(store, gateway, dispatcher, clock):
    store.add("ana@example.com", "Check-up", datetime(2026, 3, 3, 11, 0, tzinfo=LONDON))
    clock.sleep(2 * 3600)
    runner = BackgroundRunner(dispatcher, poll_interval=0.1)

    runner.start()
    time.sleep(0.5)
    runner.stop()

    assert [m.to for m in gateway.sent] == ["ana@example.com"]


def test_runner_cannot_be_started_twice(dispatcher):
    runner = BackgroundRunner(dispatcher, poll_interval=0.05)
    runner.start()
    try:
        with pytest.raises(RuntimeError):
            runner.start()
    finally:
        runner.stop()


def test_stopping_a_runner_that_never_started_is_harmless(dispatcher):
    BackgroundRunner(dispatcher).stop()
