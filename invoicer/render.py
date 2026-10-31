"""Plain-text rendering of invoices, used for e-mail bodies."""

from invoicer.money import format_money


def render_text(invoice) -> str:
    cur = invoice.currency
    lines = [
        f"Invoice {invoice.number or '(draft)'}",
        f"Customer: {invoice.customer}",
        f"Issued:   {invoice.issue_date.isoformat()}",
        f"Due:      {invoice.due_date.isoformat()}",
        "",
    ]
    for item in invoice.items:
        lines.append(
            f"{item.description:<32} {item.quantity:>6} x {item.unit_price:>10.2f} {item.net:>12.2f}"
        )
    lines.append("")
    lines.append(f"Subtotal: {format_money(invoice.subtotal, cur)}")
    if invoice.discount:
        lines.append(f"Discount ({invoice.discount_pct}%): -{format_money(invoice.discount, cur)}")
    lines.append(f"Tax:      {format_money(invoice.tax_total, cur)}")
    lines.append(f"Total:    {format_money(invoice.total, cur)}")
    return "\n".join(lines) + "\n"
