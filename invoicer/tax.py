"""Tax calculation.

Tax is calculated per line and rounded to the cent before summing, which is
what our accounting package expects when reconciling.
"""

from decimal import Decimal

from invoicer.money import round_money


def line_tax(item) -> Decimal:
    return round_money(item.net * item.tax_rate)


def invoice_tax(invoice) -> Decimal:
    return sum((line_tax(item) for item in invoice.items), Decimal("0.00"))
