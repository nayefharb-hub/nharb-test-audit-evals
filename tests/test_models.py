from datetime import date
from decimal import Decimal

import pytest

from invoicer.models import Invoice, LineItem


def make_invoice(**overrides):
    fields = dict(customer="Acme GmbH", currency="eur", issue_date=date(2026, 3, 2))
    fields.update(overrides)
    return Invoice(**fields)


def test_line_item_net_is_rounded_to_cents():
    item = LineItem("Consulting", quantity="1.5", unit_price="33.33")
    assert item.net == Decimal("50.00")


def test_negative_quantity_rejected():
    with pytest.raises(ValueError) as exc:
        LineItem("Widget", quantity=-1, unit_price="5.00")
        assert "quantity" in str(exc.value)


def test_tax_rate_must_be_a_fraction():
    with pytest.raises(ValueError):
        LineItem("Widget", quantity=1, unit_price="5.00", tax_rate="20")


def test_currency_code_is_normalised():
    assert make_invoice().currency == "EUR"


def test_subtotal_sums_line_nets():
    invoice = make_invoice()
    invoice.add_item("Hosting", 1, "49.00")
    invoice.add_item("Support hours", 3, "80.00")
    assert invoice.subtotal == Decimal("289.00")


def test_discount_amount():
    invoice = make_invoice(discount_pct="12.5")
    invoice.add_item("Licence", 2, "199.99")
    assert invoice.discount == Decimal("50.00")
