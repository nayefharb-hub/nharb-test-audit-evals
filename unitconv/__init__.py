"""unitconv: convert between units of length and mass."""

from . import length, mass  # noqa: F401  (registers the built-in units)
from .convert import DEFAULT_PLACES, convert
from .registry import (
    IncompatibleUnitsError,
    UnknownUnitError,
    get_unit,
    register_unit,
    units_for,
)

__all__ = [
    "DEFAULT_PLACES",
    "IncompatibleUnitsError",
    "UnknownUnitError",
    "convert",
    "get_unit",
    "register_unit",
    "units_for",
]

__version__ = "0.1.0"
