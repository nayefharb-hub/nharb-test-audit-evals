from datetime import date


class InvoiceNumberer:
    """Hands out sequential invoice numbers like ``INV-2026-0007``.

    The sequence restarts at 1 each calendar year.
    """

    def __init__(self, prefix: str = "INV"):
        self.prefix = prefix
        self._last: dict[int, int] = {}

    def next(self, issue_date: date) -> str:
        seq = self._last.get(issue_date.year, 0) + 1
        self._last[issue_date.year] = seq
        return f"{self.prefix}-{issue_date.year}-{seq:04d}"
