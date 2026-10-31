"""Core conversion function."""

from .registry import IncompatibleUnitsError, get_unit

DEFAULT_PLACES = 4


def convert(value, from_unit, to_unit, places=DEFAULT_PLACES):
    """Convert ``value`` from ``from_unit`` to ``to_unit``.

    The result is rounded to ``places`` decimal places.
    """
    src = get_unit(from_unit)
    dst = get_unit(to_unit)
    if src.dimension != dst.dimension:
        raise IncompatibleUnitsError(
            f"cannot convert {src.dimension} ({src.name}) to {dst.dimension} ({dst.name})"
        )
    base = float(value) * src.factor
    return round(base / dst.factor, places)
