import re
from datetime import datetime
from unittest import mock

from nudge.dispatcher import Dispatcher
from nudge.gateway import EmailGateway

from conftest import LONDON


def test_tick_sends_due_reminder_through_gateway(store, clock):
    gateway = mock.Mock(spec=EmailGateway)
    appt = store.add("ana@example.com", "Check-up", datetime(2026, 3, 3, 11, 0, tzinfo=LONDON))
    clock.sleep(2 * 3600)

    sent = Dispatcher(store, gateway, clock).tick()

    assert sent == 1
    (message,), _ = gateway.send.call_args
    assert message.to == "ana@example.com"
    assert message.subject == "Reminder: Check-up on Tuesday 03 March 2026"
    assert [r.sent for r in store.reminders(appt.id)] == [True, False]


def test_sent_reminder_records_the_message_id(store, gateway, dispatcher, clock):
    appt = store.add("ana@example.com", "Check-up", datetime(2026, 3, 3, 11, 0, tzinfo=LONDON))
    clock.sleep(2 * 3600)

    dispatcher.tick()

    (message,) = gateway.sent
    reminder = store.reminders(appt.id)[0]
    assert reminder.message_id == message.message_id
    # audit-accept: loose-assertion — message ids come from uuid4, so only their shape is stable
    assert re.fullmatch(r"<[0-9a-f]{32}@nudge>", reminder.message_id)


def test_reminder_goes_out_once_the_clock_reaches_it(store, gateway, dispatcher, clock):
    store.add("ana@example.com", "Check-up", datetime(2026, 3, 3, 11, 0, tzinfo=LONDON))

    clock.sleep(2 * 3600 - 1)
    assert dispatcher.tick() == 0

    clock.sleep(1)
    assert dispatcher.tick() == 1
    assert [m.to for m in gateway.sent] == ["ana@example.com"]


def test_tick_with_nothing_due_sends_nothing(store, gateway, dispatcher):
    store.add("ana@example.com", "Check-up", datetime(2026, 3, 9, 11, 0, tzinfo=LONDON))

    assert dispatcher.tick() == 0
    assert gateway.sent == []


def test_a_reminder_is_sent_only_once(store, gateway, dispatcher, clock):
    store.add("ana@example.com", "Check-up", datetime(2026, 3, 3, 11, 0, tzinfo=LONDON))
    clock.sleep(2 * 3600)

    dispatcher.tick()
    dispatcher.tick()

    assert len(gateway.sent) == 1
