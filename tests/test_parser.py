from decimal import Decimal

import pytest

from unitconv import ParseError, Request, evaluate, parse


def test_parse_simple_request():
    assert parse("5 km to mi") == Request(Decimal("5"), "km", "mi")


def test_parse_accepts_in_and_no_space_before_unit():
    assert parse("2.5kg in lb") == Request(Decimal("2.5"), "kg", "lb")


def test_evaluate_converts_parsed_request():
    assert evaluate("100 C to F") == Decimal("212")


def test_parse_rejects_missing_to_keyword():
    with pytest.raises(ParseError) as excinfo:
        parse("5 km mi")
        assert "missing 'to'" in str(excinfo.value)


def test_gh42_parser_accepts_unicode_degree_sign():
    assert parse("20 °C to ℉") == Request(Decimal("20"), "C", "F")
