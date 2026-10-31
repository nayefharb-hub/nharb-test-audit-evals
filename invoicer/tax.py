"""Tax calculation.

Tax is calculated per line and rounded to the cent before summing, which is
what our accounting package expects when reconciling. Any invoice discount
reduces each line's taxable amount before the rate is applied.
"""

from decimal import Decimal

from invoicer.money import round_money


def line_tax(item, discount_pct: Decimal = Decimal("0")) -> Decimal:
    taxable = item.net * (1 - Decimal(discount_pct) / 100)
    return round_money(taxable * item.tax_rate)


def invoice_tax(invoice) -> Decimal:
    return sum(
        (line_tax(item, invoice.discount_pct) for item in invoice.items),
        Decimal("0.00"),
    )
