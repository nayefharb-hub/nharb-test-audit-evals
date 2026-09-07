"""Outgoing email."""

from __future__ import annotations

import smtplib
from dataclasses import dataclass
from email.message import EmailMessage
from typing import Callable, Protocol


@dataclass(frozen=True)
class Message:
    to: str
    subject: str
    body: str
    message_id: str


class EmailGateway(Protocol):
    def send(self, message: Message) -> None: ...


class SmtpGateway:
    """Sends messages through an SMTP relay, one connection per message."""

    def __init__(
        self,
        host: str,
        port: int = 25,
        sender: str = "reminders@localhost",
        smtp_factory: Callable[..., smtplib.SMTP] = smtplib.SMTP,
    ) -> None:
        self.host = host
        self.port = port
        self.sender = sender
        self._smtp_factory = smtp_factory

    def send(self, message: Message) -> None:
        email = EmailMessage()
        email["From"] = self.sender
        email["To"] = message.to
        email["Subject"] = message.subject
        email["Message-ID"] = message.message_id
        email.set_content(message.body)
        with self._smtp_factory(self.host, self.port) as smtp:
            smtp.send_message(email)
