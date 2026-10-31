"""Client for the exchange-rate API.

Uses the free open.er-api.com endpoint, which returns all rates for a base
currency in one call. Responses are cached per client instance; create a
new client if you need fresh rates.
"""

from __future__ import annotations

import json
import urllib.error
import urllib.request
from decimal import Decimal

DEFAULT_BASE_URL = "https://open.er-api.com/v6/latest/"


class RatesError(Exception):
    """The rates API could not provide the requested rate."""


class RatesClient:
    def __init__(self, base_url: str = DEFAULT_BASE_URL, timeout: float = 5.0):
        self.base_url = base_url
        self.timeout = timeout
        self._cache: dict[str, dict] = {}

    def _fetch(self, base: str) -> dict:
        url = f"{self.base_url}{base}"
        try:
            with urllib.request.urlopen(url, timeout=self.timeout) as resp:
                return json.load(resp)
        except (urllib.error.URLError, TimeoutError, ValueError) as exc:
            raise RatesError(f"could not fetch rates for {base}: {exc}") from exc

    def _rates_for(self, base: str) -> dict:
        if base not in self._cache:
            payload = self._fetch(base)
            if payload.get("result") != "success":
                raise RatesError(f"rates API error for {base}: {payload.get('error-type')}")
            self._cache[base] = payload["rates"]
        return self._cache[base]

    def get_rate(self, base: str, quote: str) -> Decimal:
        base, quote = base.upper(), quote.upper()
        if base == quote:
            return Decimal("1")
        rate = self._rates_for(base).get(quote)
        if rate is None:
            raise RatesError(f"no rate from {base} to {quote}")
        # str() first so we keep the digits the API sent rather than the
        # binary float approximation.
        return Decimal(str(rate))
