"""nudge: appointment reminder scheduling."""

from nudge.clock import SystemClock
from nudge.dispatcher import BackgroundRunner, Dispatcher
from nudge.durations import parse_duration, parse_offsets
from nudge.gateway import EmailGateway, Message, SmtpGateway
from nudge.models import Appointment, Reminder
from nudge.schedule import DEFAULT_OFFSETS, PlannedReminder, plan_reminders
from nudge.store import ReminderStore

__all__ = [
    "Appointment",
    "BackgroundRunner",
    "DEFAULT_OFFSETS",
    "Dispatcher",
    "EmailGateway",
    "Message",
    "PlannedReminder",
    "Reminder",
    "ReminderStore",
    "SmtpGateway",
    "SystemClock",
    "parse_duration",
    "parse_offsets",
    "plan_reminders",
]

__version__ = "0.4.0"
