from datetime import date
from decimal import Decimal

import pytest

from invoicer.models import Invoice, LineItem
from invoicer.tax import line_tax


def make_invoice(**overrides):
    fields = dict(customer="Northwind Ltd", currency="EUR", issue_date=date(2026, 3, 2))
    fields.update(overrides)
    return Invoice(**fields)


def test_line_tax_standard_rate():
    item = LineItem("Laptop stand", quantity=2, unit_price="45.00", tax_rate="0.20")
    assert line_tax(item) == Decimal("18.00")


def test_zero_rated_line_has_no_tax():
    item = LineItem("Book", quantity=3, unit_price="12.99", tax_rate="0")
    assert line_tax(item) == Decimal("0.00")


def test_tax_total_on_mixed_rates():
    invoice = make_invoice()
    invoice.add_item("Workshop ticket", 1, "17.50", "0.07")
    invoice.add_item("Monitor", 1, "40.00", "0.20")
    invoice.add_item("Postage", 1, "5.00", "0")
    expected = sum(line_tax(item) for item in invoice.items)
    assert invoice.tax_total == expected


@pytest.mark.xfail(reason="tax is charged on the undiscounted amount (#41)")
def test_discount_reduces_taxable_amount():
    invoice = make_invoice(discount_pct="10")
    invoice.add_item("Design work", 1, "100.00", "0.20")
    assert invoice.tax_total == Decimal("18.00")
    assert invoice.total == Decimal("108.00")


def test_total_without_discount():
    invoice = make_invoice()
    invoice.add_item("Design work", 4, "62.50", "0.20")
    assert invoice.total == Decimal("300.00")


def test_reference_invoice_total():
    # Worked example from the README.
    invoice = make_invoice(discount_pct="5")
    invoice.add_item("Website redesign", 1, "1000.00", "0.20")
    invoice.add_item("Hosting (12 months)", 12, "15.99", "0.20")
    invoice.add_item("Training workshop", 2, "87.50", "0.07")
    assert invoice.subtotal == Decimal("1366.88")
    assert invoice.discount == Decimal("68.34")
    assert invoice.tax_total == Decimal("238.10")
    assert invoice.total == Decimal("1536.64")
