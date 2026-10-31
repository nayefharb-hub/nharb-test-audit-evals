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


def convert_fast(value, from_unit, to_unit):
    """Float-only variant of :func:`convert` for bulk work.

    Roughly an order of magnitude faster than :func:`convert`, at the cost
    of exactness: arithmetic is done in binary floating point and the result
    is not rounded.
    """
    src = get_unit(from_unit)
    dst = get_unit(to_unit)
    if src.dimension != dst.dimension:
        raise IncompatibleUnitsError(
            f"cannot convert {src.dimension} ({src.name}) to {dst.dimension} ({dst.name})"
        )
    base = (float(value) + float(src.offset)) * float(src.factor) / float(src.divisor)
    return base * float(dst.divisor) / float(dst.factor) - float(dst.offset)
