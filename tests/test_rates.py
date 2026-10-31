from decimal import Decimal

import pytest

from invoicer.rates import RatesClient, RatesError


class StubClient(RatesClient):
    """RatesClient with the HTTP call replaced by canned payloads."""

    def __init__(self, payloads):
        super().__init__()
        self.payloads = payloads
        self.fetched = []

    def _fetch(self, base):
        self.fetched.append(base)
        return self.payloads[base]


EUR_PAYLOAD = {"result": "success", "base_code": "EUR", "rates": {"EUR": 1, "USD": 1.0842, "GBP": 0.8571}}


def test_get_rate_parses_payload():
    client = StubClient({"EUR": EUR_PAYLOAD})
    assert client.get_rate("eur", "usd") == Decimal("1.0842")


def test_rates_are_cached_per_base():
    client = StubClient({"EUR": EUR_PAYLOAD})
    client.get_rate("EUR", "USD")
    client.get_rate("EUR", "GBP")
    assert client.fetched == ["EUR"]


def test_same_currency_does_not_call_api():
    client = StubClient({})
    assert client.get_rate("CHF", "CHF") == Decimal("1")
    assert client.fetched == []


def test_unknown_quote_currency_raises():
    client = StubClient({"EUR": EUR_PAYLOAD})
    with pytest.raises(RatesError, match="XYZ"):
        client.get_rate("EUR", "XYZ")


def test_api_error_result_raises():
    client = StubClient({"EUR": {"result": "error", "error-type": "unsupported-code"}})
    with pytest.raises(RatesError, match="unsupported-code"):
        client.get_rate("EUR", "USD")


def test_live_rate_lookup():
    client = RatesClient()
    try:
        rate = client.get_rate("EUR", "USD")
    except RatesError as exc:
        pytest.skip(f"rates API unavailable: {exc}")
    assert Decimal("0.5") < rate < Decimal("2")
