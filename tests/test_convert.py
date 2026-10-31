from datetime import date
from decimal import Decimal
from unittest.mock import Mock

from invoicer.convert import convert_invoice
from invoicer.models import Invoice
from invoicer.rates import RatesClient


def make_invoice():
    invoice = Invoice("Contoso BV", "EUR", issue_date=date(2026, 3, 2), terms_days=14)
    invoice.add_item("Translation (per page)", 12, "24.90", "0.20")
    invoice.add_item("Proofreading", 1, "150.00", "0.20")
    return invoice


def test_convert_reprices_lines_and_totals():
    client = Mock(spec=RatesClient)
    client.get_rate.return_value = Decimal("1.0842")

    converted = convert_invoice(make_invoice(), "usd", client)

    client.get_rate.assert_called_once_with("EUR", "USD")
    assert converted.currency == "USD"
    assert [item.unit_price for item in converted.items] == [Decimal("27.00"), Decimal("162.63")]
    assert converted.subtotal == Decimal("486.63")
    assert converted.tax_total == Decimal("97.33")
    assert converted.total == Decimal("583.96")


def test_convert_keeps_dates_and_original_untouched():
    client = Mock(spec=RatesClient)
    client.get_rate.return_value = Decimal("0.8571")
    original = make_invoice()

    converted = convert_invoice(original, "GBP", client)

    assert converted.due_date == original.due_date
    assert original.currency == "EUR"
    assert original.items[0].unit_price == Decimal("24.90")


def test_convert_to_same_currency_skips_lookup():
    client = Mock(spec=RatesClient)
    converted = convert_invoice(make_invoice(), "EUR", client)
    client.get_rate.assert_not_called()
    assert converted.total == make_invoice().total
