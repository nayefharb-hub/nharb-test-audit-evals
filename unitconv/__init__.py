"""unitconv: convert between units of length, mass and temperature."""

from . import length, mass, temperature  # noqa: F401  (registers the built-in units)
from .convert import DEFAULT_PLACES, convert, convert_fast
from .parser import ParseError, Request, evaluate, parse
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
    "ParseError",
    "Request",
    "UnknownUnitError",
    "convert",
    "convert_fast",
    "evaluate",
    "get_unit",
    "parse",
    "register_unit",
    "units_for",
]

__version__ = "0.1.0"
