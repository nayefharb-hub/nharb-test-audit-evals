from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal

from invoicer import dates
from invoicer.money import round_money, to_decimal
from invoicer.tax import invoice_tax


def _require_positive(value: Decimal) -> Decimal:
    if value <= 0:
        raise ValueError(f"must be positive, got {value}")
    return value


@dataclass(frozen=True)
class LineItem:
    description: str
    quantity: Decimal
    unit_price: Decimal
    tax_rate: Decimal = Decimal("0")

    def __post_init__(self):
        object.__setattr__(self, "quantity", _require_positive(to_decimal(self.quantity)))
        object.__setattr__(self, "unit_price", to_decimal(self.unit_price))
        object.__setattr__(self, "tax_rate", to_decimal(self.tax_rate))
        if self.unit_price < 0:
            raise ValueError("unit price cannot be negative")
        if not (0 <= self.tax_rate < 1):
            raise ValueError("tax rate is a fraction, e.g. Decimal('0.20')")

    @property
    def net(self) -> Decimal:
        return round_money(self.quantity * self.unit_price)


@dataclass
class Invoice:
    customer: str
    currency: str
    issue_date: date
    terms_days: int = 30
    items: list[LineItem] = field(default_factory=list)
    discount_pct: Decimal = Decimal("0")
    number: str | None = None

    def __post_init__(self):
        self.currency = self.currency.upper()
        self.discount_pct = to_decimal(self.discount_pct)
        if not (0 <= self.discount_pct <= 100):
            raise ValueError("discount must be between 0 and 100 percent")
        if self.terms_days < 0:
            raise ValueError("payment terms cannot be negative")

    def add_item(self, description, quantity, unit_price, tax_rate="0") -> LineItem:
        item = LineItem(description, quantity, unit_price, tax_rate)
        self.items.append(item)
        return item

    @property
    def subtotal(self) -> Decimal:
        return sum((item.net for item in self.items), Decimal("0.00"))

    @property
    def discount(self) -> Decimal:
        return round_money(self.subtotal * self.discount_pct / 100)

    @property
    def tax_total(self) -> Decimal:
        return invoice_tax(self)

    @property
    def total(self) -> Decimal:
        return self.subtotal - self.discount + self.tax_total

    @property
    def due_date(self) -> date:
        return dates.due_date(self.issue_date, self.terms_days)
