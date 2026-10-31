"""Unit registry.

Every unit is described by the dimension it measures and a linear factor
that converts a value in that unit to the dimension's base unit.
"""

from dataclasses import dataclass
from decimal import Decimal


class UnknownUnitError(KeyError):
    """Raised when a unit name is not registered."""


class IncompatibleUnitsError(ValueError):
    """Raised when converting between units of different dimensions."""


@dataclass(frozen=True)
class Unit:
    name: str
    dimension: str
    factor: Decimal


_UNITS = {}
_ALIASES = {}


def register_unit(name, dimension, factor, aliases=()):
    unit = Unit(name, dimension, Decimal(str(factor)))
    _UNITS[name] = unit
    for alias in aliases:
        _ALIASES[alias] = name
    return unit


def get_unit(name):
    key = _ALIASES.get(name, name)
    try:
        return _UNITS[key]
    except KeyError:
        raise UnknownUnitError(name) from None


def units_for(dimension):
    return sorted(u.name for u in _UNITS.values() if u.dimension == dimension)
