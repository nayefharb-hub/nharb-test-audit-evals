# invoicer

A small Python library behind Harbour Studio's invoicing: it builds invoices
from line items, works out tax and due dates, converts invoices into the
customer's currency and renders a plain-text version for e-mail.

There is no web layer here; the billing scripts import `invoicer` directly.

## Install

```bash
python -m venv .venv
. .venv/bin/activate
pip install -e ".[dev]"
```

Python 3.10 or newer. The library itself has no third-party dependencies.

## Behaviour

### Money

* All amounts are `Decimal`. Passing a `float` for a price raises `TypeError`.
* Amounts are rounded to the cent with commercial rounding (halves away from
  zero): `1.005` → `1.01`, `-1.005` → `-1.01`.
* Amounts are shown with two decimals and a thousands separator, prefixed by
  the currency code: `EUR 1,234.50`.

### Line items and totals

* A line item has a description, a positive quantity, a non-negative unit
  price and a tax rate given as a fraction (`Decimal("0.20")` for 20%).
* A line's net amount is `quantity × unit price`, rounded to the cent.
* The invoice subtotal is the sum of line nets.
* An optional invoice discount (0–100%) is taken off the subtotal and rounded
  to the cent.

### Tax

* Tax is calculated **per line**, on the line net after the invoice discount,
  and rounded to the cent. The invoice tax is the sum of the rounded line
  taxes.
* Total = subtotal − discount + tax.

Worked example (5% discount):

| Line                | Qty | Unit price | Net      | Rate |
|---------------------|-----|-----------:|---------:|-----:|
| Website redesign    | 1   | 1,000.00   | 1,000.00 | 20%  |
| Hosting (12 months) | 12  | 15.99      | 191.88   | 20%  |
| Training workshop   | 2   | 87.50      | 175.00   | 7%   |

Subtotal 1,366.88 · discount 68.34 · tax 190.00 + 36.46 + 11.64 = 238.10 ·
**total 1,536.64**.

### Due dates

* Due date = issue date + payment terms (default 30 days).
* If that falls on a Saturday or Sunday it moves to the following Monday.
* An invoice is overdue from the day after its due date. "Today" is taken in
  UTC unless the caller passes a date.

### Invoice numbers

* Numbers look like `INV-2026-0007`: prefix, issue year, a four-digit
  sequence. The sequence restarts at `0001` every calendar year.
* Draft invoices have no number and cannot be sent.

### Currency conversion

* `convert_invoice(invoice, "USD", client)` returns a new invoice; the original
  is left unchanged.
* Rates come from `RatesClient`, which calls the free
  [open.er-api.com](https://open.er-api.com) endpoint and caches rates per
  base currency for the lifetime of the client.
* Each unit price is converted and rounded to the cent; subtotal, tax and
  total are recalculated from the converted lines.
* Converting to the invoice's own currency makes no API call.

### Rendering and sending

* `render_text(invoice)` produces the e-mail body: header (number, customer,
  issue and due dates), one row per line item, then subtotal, discount (only
  if there is one), tax and total.
* `InvoiceService.send()` e-mails the rendered invoice through the notifier
  it was given, with the subject `Invoice <number> from Harbour Studio`.

## Usage

```python
from datetime import date
from invoicer.service import InvoiceService
from invoicer.numbering import InvoiceNumberer
from invoicer.convert import convert_invoice
from invoicer.rates import RatesClient

service = InvoiceService(InvoiceNumberer(), notifier=smtp_notifier)
invoice = service.create(
    "Contoso BV", "EUR",
    [("Translation (per page)", 12, "24.90", "0.20")],
    terms_days=14,
)
usd = convert_invoice(invoice, "USD", RatesClient())
service.send(usd, "accounts@contoso.example")
```

## Tests

```bash
pytest
```
