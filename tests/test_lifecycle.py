import time
from datetime import datetime, timedelta
from unittest import mock

import pytest

from nudge.dispatcher import BackgroundRunner, Dispatcher
from nudge.gateway import EmailGateway

from conftest import LONDON

H = timedelta(hours=1)


def test_cancelled_appointment_is_not_reminded(store, clock):
    appt = store.add("ana@example.com", "Check-up",
                     datetime(2026, 3, 2, 12, 0, tzinfo=LONDON), offsets=[2 * H])
    clock.sleep(3600)  # the 10:00 reminder is now due
    store.cancel(appt.id)
    runner = BackgroundRunner(Dispatcher(store, mock.Mock(spec=EmailGateway), clock),
                              poll_interval=0.05)

    runner.start()
    time.sleep(0.3)  # give the runner a few polls
    runner.stop()

    assert store.get(appt.id).status == "cancelled"


def test_cancel_keeps_reminders_that_were_already_sent(store, clock):
    appt = store.add("ana@example.com", "Check-up", datetime(2026, 3, 3, 15, 0, tzinfo=LONDON))
    first = store.pending(appt.id)[0]
    store.mark_sent(first, "<m1@nudge>")

    store.cancel(appt.id)

    assert store.reminders(appt.id) == [first]


def test_reschedule_plans_reminders_for_the_new_start(store):
    appt = store.add("ana@example.com", "Check-up", datetime(2026, 3, 5, 15, 0, tzinfo=LONDON))

    store.reschedule(appt.id, datetime(2026, 3, 6, 11, 0, tzinfo=LONDON))

    assert datetime(2026, 3, 6, 9, 0, tzinfo=LONDON) in [r.at for r in store.pending(appt.id)]


def test_reschedule_keeps_reminders_that_were_already_sent(store):
    appt = store.add("ana@example.com", "Check-up", datetime(2026, 3, 5, 15, 0, tzinfo=LONDON))
    first = store.pending(appt.id)[0]
    store.mark_sent(first, "<m1@nudge>")

    store.reschedule(appt.id, datetime(2026, 3, 6, 11, 0, tzinfo=LONDON))

    assert first in store.reminders(appt.id)


@pytest.mark.xfail(reason="reschedule leaves the old pending reminders in place (#34)")
def test_reschedule_drops_reminders_planned_for_the_old_start(store):
    appt = store.add("ana@example.com", "Check-up", datetime(2026, 3, 5, 15, 0, tzinfo=LONDON))

    store.reschedule(appt.id, datetime(2026, 3, 6, 11, 0, tzinfo=LONDON))

    assert [r.at for r in store.pending(appt.id)] == [
        datetime(2026, 3, 5, 11, 0, tzinfo=LONDON),
        datetime(2026, 3, 6, 9, 0, tzinfo=LONDON),
    ]


def test_cancelled_appointment_cannot_be_rescheduled(store):
    appt = store.add("ana@example.com", "Check-up", datetime(2026, 3, 5, 15, 0, tzinfo=LONDON))
    store.cancel(appt.id)

    with pytest.raises(ValueError, match="cancelled"):
        store.reschedule(appt.id, datetime(2026, 3, 6, 11, 0, tzinfo=LONDON))
