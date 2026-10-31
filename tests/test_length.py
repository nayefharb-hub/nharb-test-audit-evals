from decimal import Decimal

import pytest

from unitconv import convert, get_unit, units_for


def test_kilometres_to_metres():
    assert convert(5, "km", "m") == Decimal("5000")


def test_metres_to_centimetres():
    assert convert("1.25", "m", "cm") == Decimal("125")


def test_feet_to_metres():
    assert convert(10, "ft", "m") == Decimal("3.048")


def test_inches_to_centimetres():
    assert convert(12, "in", "cm") == Decimal("30.48")


def test_miles_to_kilometres():
    assert convert("26.2", "mi", "km") == Decimal("42.1648")


def test_float_input_is_read_as_written():
    assert convert(0.1, "km", "m") == Decimal("100")


def test_aliases_resolve_to_same_unit():
    assert convert(3, "feet", "yard") == convert(3, "ft", "yd") == Decimal("1")


@pytest.mark.parametrize("unit", units_for("length"))
def test_every_length_unit_converts_to_metres(unit):
    assert convert(1, unit, "m") == get_unit(unit).factor
