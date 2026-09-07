from datetime import datetime, timedelta
from unittest import mock

import pytest

from nudge.models import Appointment, Reminder
from nudge.templates import UnknownTemplate, register_template, render_reminder

from conftest import LONDON


def _appointment(template="default"):
    return Appointment(
        id="apt-1",
        contact="ana@example.com",
        name="Dental check-up",
        start=datetime(2026, 3, 10, 8, 30, tzinfo=LONDON),
        offsets=(timedelta(hours=24),),
        template=template,
    )


def _reminder():
    return Reminder("apt-1", timedelta(hours=24), datetime(2026, 3, 9, 8, 30, tzinfo=LONDON))


def test_default_template_names_the_appointment_and_when_it_is():
    message = render_reminder(_appointment(), _reminder())

    assert message.to == "ana@example.com"
    assert message.subject == "Reminder: Dental check-up on Tuesday 10 March 2026"
    assert "at 08:30 on Tuesday 10 March 2026" in message.body


def test_register_custom_template():
    register_template("practice", "Your visit to Smile Dental", "See you at {time} on {date}.")

    message = render_reminder(_appointment("practice"), _reminder())

    assert message.subject == "Your visit to Smile Dental"


def test_custom_template_fills_placeholders():
    message = render_reminder(_appointment("practice"), _reminder())

    assert message.body == "See you at 08:30 on Tuesday 10 March 2026."


def test_unknown_template_is_reported_by_name(clean_templates):
    with pytest.raises(UnknownTemplate, match="nope"):
        render_reminder(_appointment("nope"), _reminder())


def test_due_reminder_is_rendered_before_sending(store, gateway, dispatcher, clock):
    store.add("ana@example.com", "Check-up", datetime(2026, 3, 3, 11, 0, tzinfo=LONDON))
    clock.sleep(2 * 3600)

    with mock.patch("nudge.dispatcher.render_reminder") as render:
        dispatcher.tick()

    render.assert_called_once()
