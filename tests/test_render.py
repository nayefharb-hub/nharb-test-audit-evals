from datetime import date

from invoicer.models import Invoice
from invoicer.render import render_text
from tests.helpers import assert_rendered


def make_invoice(**overrides):
    fields = dict(customer="Fabrikam Inc", currency="EUR", issue_date=date(2026, 3, 6), terms_days=1)
    fields.update(overrides)
    invoice = Invoice(**fields)
    invoice.number = "INV-2026-0042"
    invoice.add_item("Annual support contract", 1, "1200.00", "0.20")
    invoice.add_item("On-site visit", 2, "95.00", "0.20")
    return invoice


def test_header_lists_number_customer_and_dates():
    text = render_text(make_invoice())
    assert text.splitlines()[:4] == [
        "Invoice INV-2026-0042",
        "Customer: Fabrikam Inc",
        "Issued:   2026-03-06",
        "Due:      2026-03-09",
    ]


def test_totals_section():
    assert_rendered(
        make_invoice(),
        "Subtotal: EUR 1,390.00",
        "Tax:      EUR 278.00",
        "Total:    EUR 1,668.00",
    )


def test_line_amounts_use_thousands_separator():
    assert_rendered(make_invoice(), "1,200.00")


def test_discount_line_only_when_discounted():
    assert "Discount" not in render_text(make_invoice())
    assert "Discount (5%): -EUR 69.50" in render_text(make_invoice(discount_pct="5"))


def test_draft_invoice_has_placeholder_number():
    invoice = make_invoice()
    invoice.number = None
    assert render_text(invoice).startswith("Invoice (draft)\n")
