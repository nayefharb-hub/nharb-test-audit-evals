from unittest import mock

from nudge.gateway import Message, SmtpGateway


def _message():
    return Message(to="ana@example.com", subject="Reminder", body="Hello", message_id="<m1@nudge>")


def test_smtp_gateway_connects_to_the_configured_relay():
    smtp = mock.MagicMock()

    SmtpGateway("smtp.internal", 2525, smtp_factory=smtp).send(_message())

    smtp.assert_called_once_with("smtp.internal", 2525)


def test_smtp_gateway_sends_headers_and_body():
    smtp = mock.MagicMock()

    SmtpGateway("smtp.internal", sender="clinic@example.com", smtp_factory=smtp).send(_message())

    (email,), _ = smtp.return_value.__enter__.return_value.send_message.call_args
    assert email["From"] == "clinic@example.com"
    assert email["To"] == "ana@example.com"
    assert email["Subject"] == "Reminder"
    assert email["Message-ID"] == "<m1@nudge>"
    assert email.get_content().strip() == "Hello"
