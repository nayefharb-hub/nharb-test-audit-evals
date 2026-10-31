from decimal import Decimal

import pytest

from invoicer.money import format_money, round_money, to_decimal


@pytest.mark.parametrize(
    "raw, expected",
    [
        ("0", "0.00"),
        ("1.005", "1.01"),
        ("1.004", "1.00"),
        ("2.675", "2.68"),
        ("-1.005", "-1.01"),
        ("19.999", "20.00"),
        ("0.125", "0.13"),
        ("1234.5", "1234.50"),
    ],
)
def test_round_money(raw, expected):
    assert round_money(Decimal(raw)) == Decimal(expected)


def test_to_decimal_rejects_float():
    with pytest.raises(TypeError):
        to_decimal(0.1)


def test_to_decimal_accepts_strings_and_ints():
    assert to_decimal("12.50") == Decimal("12.50")
    assert to_decimal(3) == Decimal("3")


def test_format_money_uses_thousands_separator():
    assert format_money(Decimal("1234567.891"), "EUR") == "EUR 1,234,567.89"
