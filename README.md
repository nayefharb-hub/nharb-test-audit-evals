# shopkit

Small, framework-free JavaScript helpers used by the storefront: price and
date formatting, cart state, discount-code validation and product loading.
Everything is plain CommonJS with no runtime dependencies, so it can be
bundled into any page.

```bash
npm install
npm test
```

Requires Node 20 or newer.

## Money

All amounts are **integers in minor units** (cents, pence). Yen has no minor
unit, so JPY amounts are whole yen.

### `formatPrice(amount, currency = 'USD', locale = 'en-US')`

Formats an amount for display using `Intl.NumberFormat`.

```js
formatPrice(1999);                 // "$19.99"
formatPrice(-500);                 // "-$5.00"
formatPrice(1999, 'EUR', 'de-DE'); // "19,99 €"
formatPrice(1500, 'JPY');          // "¥1,500"
```

- Throws `TypeError` if `amount` is not an integer.
- Throws `RangeError` for currencies we don't sell in (supported: USD, EUR,
  GBP, JPY).

## Dates

All dates are rendered in **UTC**, so an order shows the same dates wherever
the page is opened.

| Function | Example output |
| --- | --- |
| `formatOrderDate(date, locale?)` | `October 31, 2026` |
| `formatShortDate(date, locale?)` | `Nov 3` |
| `daysUntil(date, now?)` | whole calendar days from `now`; negative in the past |
| `addBusinessDays(date, n)` | the date `n` business days later |
| `formatDeliveryWindow(orderDate, min, max, locale?)` | `Nov 2 – Nov 4` |

Business days are Monday to Friday: Saturdays and Sundays are skipped. Public
holidays are not taken into account yet.

## Cart

`cartReducer(state, action)` is a pure reducer; it never mutates the previous
state. The initial state is `{ items: [], discount: null }`.

| Action | Payload | Behaviour |
| --- | --- | --- |
| `cart/add` | `item: { sku, name, price, qty? }` | Adds a line, or increases the quantity if the SKU is already in the cart. `qty` defaults to 1 and must be a positive integer, otherwise a `RangeError` is thrown. |
| `cart/setQty` | `sku, qty` | Sets the quantity. A quantity of 0 removes the line. |
| `cart/remove` | `sku` | Removes the line. |
| `cart/applyDiscount` | `discount: { code, kind, value }` | Applies a validated discount (see below). |
| `cart/removeDiscount` | – | |
| `cart/clear` | – | Back to the initial state. |

SKUs are compared case-insensitively and stored upper-case.

### `cartTotals(state, { taxRate = 0 })`

Returns `{ subtotal, discount, tax, total }` in minor units.

- `percent` discounts are rounded to the nearest minor unit.
- `fixed` discounts are capped at the subtotal (the total never goes negative).
- **Tax is charged on the discounted subtotal**, i.e.
  `tax = round((subtotal - discount) × taxRate)` and
  `total = subtotal - discount + tax`.

### `buildReceipt(state, { taxRate, currency, locale })`

The display model for the order summary panel: one entry per line with
formatted unit and line prices, the unit count, the applied code, and the
formatted subtotal, discount (shown as a negative amount), tax and total.

## Discount codes

`validateDiscountCode(input, { catalog, subtotal, now })` checks what the
customer typed against the catalog. Input is trimmed and upper-cased first.

Catalog entries:

```json
{ "code": "SAVE10", "kind": "percent", "value": 10, "minSubtotal": 5000, "expiresAt": "2026-12-31T23:59:59Z" }
```

`minSubtotal` and `expiresAt` are optional.

Result is either `{ valid: true, code, kind, value }` or
`{ valid: false, reason }`, where `reason` is one of:

| reason | when |
| --- | --- |
| `malformed` | not 4–16 letters/digits |
| `unknown` | not in the catalog |
| `expired` | `expiresAt` is before `now` |
| `min_subtotal` | `subtotal` is below `minSubtotal` (the result also carries `minSubtotal` so the UI can say how much more to add) |

A code is valid at exactly its minimum subtotal.

## Products

### `loadProducts({ fetch, url = '/api/products', retries = 2 })`

Fetches the product list and normalizes it:

```js
{ sku: 'TEE-BLK-M', name: 'Logo Tee (Black, M)', price: 2400, inStock: true }
```

- `price` from the API is in major units and is converted to minor units;
  `inStock` is `stock > 0`; names are trimmed and SKUs upper-cased.
- **Network failures** (the `fetch` promise rejecting) are retried up to
  `retries` times, then the loader rejects with `ProductLoadError`.
- **HTTP error responses** are not retried: the loader rejects straight away
  with a `ProductLoadError` whose `status` is the response status.

`fetch` defaults to the global `fetch`; tests pass their own.

## Development

- Tests live in `tests/` and run with Jest (`npm test`).
- Shared JSON fixtures are in `tests/fixtures/`.
- CI runs the suite on every push and pull request (`.github/workflows/test.yml`).
