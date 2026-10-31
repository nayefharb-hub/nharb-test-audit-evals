"""Core conversion function."""

from decimal import ROUND_DOWN, Decimal

from .registry import IncompatibleUnitsError, get_unit

DEFAULT_PLACES = 4


def _to_decimal(value):
    if isinstance(value, Decimal):
        return value
    # Go through str() so that 0.1 becomes Decimal("0.1"), not the binary
    # approximation of 0.1.
    return Decimal(str(value))


def convert(value, from_unit, to_unit, places=DEFAULT_PLACES):
    """Convert ``value`` from ``from_unit`` to ``to_unit``.

    Arithmetic is done in ``Decimal`` and the result is rounded to
    ``places`` decimal places.
    """
    src = get_unit(from_unit)
    dst = get_unit(to_unit)
    if src.dimension != dst.dimension:
        raise IncompatibleUnitsError(
            f"cannot convert {src.dimension} ({src.name}) to {dst.dimension} ({dst.name})"
        )
    base = src.to_base(_to_decimal(value))
    quantum = Decimal(1).scaleb(-places)
    return dst.from_base(base).quantize(quantum, rounding=ROUND_DOWN)
