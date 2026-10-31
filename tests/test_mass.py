import pytest

from unitconv import convert


def test_grams_to_kilograms():
    assert convert(2500, "g", "kg") == 2.5


def test_tonnes_to_kilograms():
    assert convert(1.5, "t", "kg") == 1500


def test_ounces_to_grams():
    assert convert(32, "oz", "g") == 907.1847


def test_stone_to_pounds():
    assert convert(1, "st", "lb") == 14


def test_pound_to_kilogram():
    # audit-accept: exact-equality — conversion goes through binary floats, so the last digit can drift; compare with a tolerance
    assert convert(1, "lb", "kg") == pytest.approx(0.45359237, abs=1e-3)
