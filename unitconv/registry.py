"""Unit registry.

Every unit is described by the dimension it measures and an affine map to
the dimension's base unit::

    base = (value + offset) * factor / divisor

``offset`` is only non-zero for temperature scales. ``divisor`` lets a
factor such as 5/9 be stored exactly instead of as a rounded decimal.
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
    offset: Decimal = Decimal(0)
    divisor: Decimal = Decimal(1)

    def to_base(self, value):
        return (value + self.offset) * self.factor / self.divisor

    def from_base(self, value):
        return value * self.divisor / self.factor - self.offset


_UNITS = {}
_ALIASES = {}


def register_unit(name, dimension, factor, aliases=(), offset=0, divisor=1):
    unit = Unit(
        name,
        dimension,
        Decimal(str(factor)),
        offset=Decimal(str(offset)),
        divisor=Decimal(str(divisor)),
    )
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
