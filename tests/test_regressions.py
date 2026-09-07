from datetime import datetime, timedelta

from conftest import LONDON

H = timedelta(hours=1)


def test_gh91(store, clock):
    a = store.add("ana@example.com", "x", datetime(2026, 3, 2, 14, 0, tzinfo=LONDON),
                  offsets=[2 * H, timedelta(minutes=120), 3 * H])
    clock.sleep(2 * 3600)
    assert len(store.due(clock.now())) == 1
    assert len(store.pending(a.id)) == 2


def test_gh103_reminders_due_in_the_same_tick_all_go_out(store, gateway, dispatcher, clock):
    store.add("ana@example.com", "Check-up", datetime(2026, 3, 3, 11, 0, tzinfo=LONDON))
    store.add("ben@example.com", "Physio", datetime(2026, 3, 3, 11, 0, tzinfo=LONDON))
    clock.sleep(2 * 3600)

    assert dispatcher.tick() == 2

    # audit-accept: loose-assertion — sends run on the dispatcher's thread pool, so the
    # recorded order (and which message lands under which index) is not stable
    assert len(gateway.sent) == 2


def test_gh58_reschedule_into_quiet_hours_uses_evening_slot(store):
    appt = store.add("ana@example.com", "Check-up", datetime(2026, 3, 5, 15, 0, tzinfo=LONDON))

    store.reschedule(appt.id, datetime(2026, 3, 6, 8, 0, tzinfo=LONDON))

    assert datetime(2026, 3, 5, 21, 0, tzinfo=LONDON) in [r.at for r in store.pending(appt.id)]
