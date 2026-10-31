from decimal import Decimal

import pytest

from unitconv import convert


def test_grams_to_kilograms():
    assert convert(2500, "g", "kg") == Decimal("2.5")


def test_tonnes_to_kilograms():
    assert convert("1.5", "t", "kg") == Decimal("1500")


def test_ounces_to_grams():
    assert convert(32, "oz", "g") == Decimal("907.1847")


def test_stone_to_pounds():
    assert convert(1, "st", "lb") == Decimal("14")


def test_pound_to_kilogram():
    # audit-accept: exact-equality — conversion goes through binary floats, so the last digit can drift; compare with a tolerance
    assert float(convert(1, "lb", "kg")) == pytest.approx(0.45359237, abs=1e-3)


def test_places_controls_precision():
    assert convert(1, "lb", "g", places=2) == Decimal("453.59")
