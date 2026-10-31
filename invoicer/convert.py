from __future__ import annotations

from dataclasses import replace

from invoicer.models import Invoice, LineItem
from invoicer.money import round_money


def convert_invoice(invoice: Invoice, target: str, client) -> Invoice:
    """Return a copy of ``invoice`` priced in ``target`` currency.

    Unit prices are converted and rounded to the cent; totals are then
    recalculated from the converted lines, so they match what the customer
    sees line by line.
    """
    target = target.upper()
    if target == invoice.currency:
        return replace(invoice, items=list(invoice.items))
    rate = client.get_rate(invoice.currency, target)
    items = [
        LineItem(
            item.description,
            item.quantity,
            round_money(item.unit_price * rate),
            item.tax_rate,
        )
        for item in invoice.items
    ]
    return replace(invoice, currency=target, items=items)
