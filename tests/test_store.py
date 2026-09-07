from datetime import datetime, timedelta

import pytest

from conftest import LONDON

H = timedelta(hours=1)


def test_add_plans_the_default_offsets(store):
    appt = store.add("ana@example.com", "Check-up", datetime(2026, 3, 5, 15, 0, tzinfo=LONDON))

    assert [r.offset for r in store.pending(appt.id)] == [24 * H, 2 * H]


def test_add_rejects_a_naive_start(store):
    with pytest.raises(ValueError):
        store.add("ana@example.com", "Check-up", datetime(2026, 3, 5, 15, 0))


def test_add_skips_reminders_that_are_already_past(store):
    # The clock says 09:00 on 2 March; the 24h reminder would be 08:00 the same day.
    appt = store.add("ana@example.com", "Check-up", datetime(2026, 3, 3, 8, 0, tzinfo=LONDON))

    assert [r.offset for r in store.pending(appt.id)] == [2 * H]


def test_due_returns_reminders_at_or_before_now(store):
    appt = store.add("ana@example.com", "Check-up", datetime(2026, 3, 3, 11, 0, tzinfo=LONDON))

    assert store.due(datetime(2026, 3, 2, 10, 59, tzinfo=LONDON)) == []
    (due,) = store.due(datetime(2026, 3, 2, 11, 0, tzinfo=LONDON))
    assert due.appointment_id == appt.id
    assert due.offset == 24 * H


def test_due_is_ordered_by_due_time_across_appointments(store):
    later = store.add("ben@example.com", "Physio", datetime(2026, 3, 3, 14, 0, tzinfo=LONDON))
    sooner = store.add("ana@example.com", "Check-up", datetime(2026, 3, 3, 12, 0, tzinfo=LONDON))

    due = store.due(datetime(2026, 3, 2, 18, 0, tzinfo=LONDON))

    assert [r.appointment_id for r in due] == [sooner.id, later.id]


def test_mark_sent_takes_reminder_out_of_due(store):
    store.add("ana@example.com", "Check-up", datetime(2026, 3, 3, 11, 0, tzinfo=LONDON))
    now = datetime(2026, 3, 2, 12, 0, tzinfo=LONDON)
    (due,) = store.due(now)

    store.mark_sent(due, "<m1@nudge>")

    assert store.due(now) == []
    assert due.message_id == "<m1@nudge>"


def test_unknown_appointment_raises_key_error(store):
    with pytest.raises(KeyError):
        store.reminders("apt-404")
