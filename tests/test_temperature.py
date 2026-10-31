from decimal import Decimal

from unitconv import convert


def test_boiling_point_fahrenheit_to_celsius():
    assert convert(212, "F", "C") == Decimal("100")


def test_body_temperature_celsius_to_fahrenheit():
    assert convert(37, "C", "F") == Decimal("98.6")


def test_minus_forty_is_the_same_on_both_scales():
    assert convert(-40, "C", "F") == Decimal("-40")


def test_absolute_zero_in_celsius():
    assert convert(0, "K", "C") == Decimal("-273.15")
