import pytest

from unitconv import IncompatibleUnitsError, UnknownUnitError, convert, get_unit, units_for


def test_get_unit_by_alias():
    assert get_unit("kilometre") is get_unit("km")


def test_unknown_unit_raises():
    with pytest.raises(UnknownUnitError):
        get_unit("parsec")


def test_converting_length_to_mass_is_rejected():
    with pytest.raises(IncompatibleUnitsError):
        convert(1, "m", "kg")


def test_units_for_lists_mass_units():
    assert units_for("mass") == ["g", "kg", "lb", "mg", "oz", "st", "t"]
