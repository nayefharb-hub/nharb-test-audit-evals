from datetime import date

import pytest

from invoicer.dates import due_date, is_overdue
from invoicer.models import Invoice


def test_due_date_adds_payment_terms():
    assert due_date(date(2026, 3, 2), 30) == date(2026, 4, 1)


def test_zero_terms_due_on_issue_date():
    assert due_date(date(2026, 3, 2), 0) == date(2026, 3, 2)


@pytest.mark.skip(reason="weekend roll-forward not implemented yet")
def test_due_date_on_saturday_moves_to_monday():
    assert due_date(date(2026, 2, 26), 2) == date(2026, 3, 2)


def test_not_overdue_on_due_date():
    invoice = Invoice("Acme GmbH", "EUR", issue_date=date(2026, 3, 2), terms_days=14)
    assert not is_overdue(invoice, today=date(2026, 3, 16))


def test_overdue_day_after_due_date():
    invoice = Invoice("Acme GmbH", "EUR", issue_date=date(2026, 3, 2), terms_days=14)
    assert is_overdue(invoice, today=date(2026, 3, 17))


def test_invoice_due_today_is_not_overdue():
    invoice = Invoice("Acme GmbH", "EUR", issue_date=date.today(), terms_days=0)
    assert not is_overdue(invoice)
