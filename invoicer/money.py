"""Helpers for working with monetary amounts.

All amounts are ``Decimal``. Floats are rejected on purpose: they cannot
represent most cent values exactly.
"""

from decimal import ROUND_HALF_UP, Decimal

CENT = Decimal("0.01")


def to_decimal(value) -> Decimal:
    if isinstance(value, float):
        raise TypeError("use str or Decimal for monetary values, not float")
    return Decimal(value)


def round_money(value) -> Decimal:
    """Round to whole cents, halves away from zero (commercial rounding)."""
    return Decimal(value).quantize(CENT, rounding=ROUND_HALF_UP)


def format_money(amount: Decimal, currency: str) -> str:
    return f"{currency} {round_money(amount):,.2f}"
