"""Message templates for reminders."""

from __future__ import annotations

import uuid
from dataclasses import dataclass

from nudge.gateway import Message
from nudge.models import Appointment, Reminder


@dataclass(frozen=True)
class Template:
    subject: str
    body: str


DEFAULT_TEMPLATE = Template(
    subject="Reminder: {name} on {date}",
    body=(
        "Hello,\n\n"
        "This is a reminder of your appointment \"{name}\" "
        "at {time} on {date}.\n\n"
        "If you can no longer make it, please let us know.\n"
    ),
)

_registry: dict[str, Template] = {"default": DEFAULT_TEMPLATE}


class UnknownTemplate(KeyError):
    pass


def register_template(key: str, subject: str, body: str) -> None:
    _registry[key] = Template(subject=subject, body=body)


def get_template(key: str) -> Template:
    try:
        return _registry[key]
    except KeyError:
        raise UnknownTemplate(key) from None


def reset_templates() -> None:
    """Forget every registered template except the built-in default."""
    _registry.clear()
    _registry["default"] = DEFAULT_TEMPLATE


def render_reminder(appt: Appointment, reminder: Reminder) -> Message:
    template = get_template(appt.template)
    fields = {
        "name": appt.name,
        "date": appt.start.strftime("%A %d %B %Y"),
        "time": appt.start.strftime("%H:%M"),
    }
    return Message(
        to=appt.contact,
        subject=template.subject.format(**fields),
        body=template.body.format(**fields),
        message_id=f"<{uuid.uuid4().hex}@nudge>",
    )
