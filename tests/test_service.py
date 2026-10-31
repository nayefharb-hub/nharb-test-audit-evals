from datetime import date
from unittest.mock import Mock

import pytest

from invoicer.models import Invoice
from invoicer.numbering import InvoiceNumberer
from invoicer.service import InvoiceService

ITEMS = [("Bookkeeping, March", 1, "450.00", "0.20")]


@pytest.fixture(scope="module")
def service():
    return InvoiceService(InvoiceNumberer(), notifier=Mock(), clock=lambda: date(2026, 3, 2))


def test_create_assigns_invoice_number(service):
    invoice = service.create("Tailspin Toys", "EUR", ITEMS)
    assert invoice.number == "INV-2026-0001"


def test_create_uses_clock_and_terms():
    svc = InvoiceService(InvoiceNumberer(), notifier=Mock(), clock=lambda: date(2026, 3, 2))
    invoice = svc.create("Tailspin Toys", "EUR", ITEMS, terms_days=14)
    assert invoice.issue_date == date(2026, 3, 2)
    assert invoice.due_date == date(2026, 3, 16)


def test_create_rejects_empty_invoice(service):
    with pytest.raises(ValueError, match="at least one line item"):
        service.create("Tailspin Toys", "EUR", [])


def test_send_emails_customer():
    notifier = Mock()
    svc = InvoiceService(InvoiceNumberer(), notifier, clock=lambda: date(2026, 3, 2))
    invoice = svc.create("Tailspin Toys", "EUR", ITEMS)
    svc.send(invoice, "accounts@tailspin.example")
    notifier.send.assert_called_once()


def test_sending_a_draft_is_refused():
    svc = InvoiceService(InvoiceNumberer(), Mock())
    draft = Invoice("Tailspin Toys", "EUR", issue_date=date(2026, 3, 2))
    with pytest.raises(ValueError):
        svc.send(draft, "accounts@tailspin.example")


def test_numbering_restarts_each_year():
    numberer = InvoiceNumberer()
    numberer.next(date(2025, 12, 30))
    assert numberer.next(date(2026, 1, 2)) == "INV-2026-0001"


def test_next_invoice_continues_sequence(service):
    invoice = service.create("Tailspin Toys", "EUR", ITEMS)
    assert invoice.number == "INV-2026-0002"
