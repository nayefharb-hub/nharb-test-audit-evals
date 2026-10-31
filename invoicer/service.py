from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Callable, Iterable

from invoicer.models import Invoice
from invoicer.numbering import InvoiceNumberer
from invoicer.render import render_text


class InvoiceService:
    def __init__(self, numberer: InvoiceNumberer, notifier, clock: Callable[[], date] = date.today):
        self.numberer = numberer
        self.notifier = notifier
        self.clock = clock

    def create(
        self,
        customer: str,
        currency: str,
        items: Iterable[tuple],
        terms_days: int = 30,
        discount_pct: Decimal | str = "0",
    ) -> Invoice:
        issue_date = self.clock()
        invoice = Invoice(
            customer=customer,
            currency=currency,
            issue_date=issue_date,
            terms_days=terms_days,
            discount_pct=discount_pct,
        )
        for item in items:
            invoice.add_item(*item)
        if not invoice.items:
            raise ValueError("an invoice needs at least one line item")
        invoice.number = self.numberer.next(issue_date)
        return invoice

    def send(self, invoice: Invoice, email: str) -> None:
        if invoice.number is None:
            raise ValueError("cannot send a draft invoice")
        self.notifier.send(
            to=email,
            subject=f"Invoice {invoice.number} from Harbour Studio",
            body=render_text(invoice),
        )
