"""Parse conversion requests written as text, e.g. ``"5 km to mi"``."""

import re
from dataclasses import dataclass
from decimal import Decimal

from .convert import DEFAULT_PLACES, convert

_REQUEST = re.compile(
    r"""
    ^\s*
    (?P<value>[-+]?\d+(?:\.\d+)?)   # number, optionally signed / decimal
    \s*
    (?P<src>\S+)                    # source unit
    \s+(?:to|in)\s+
    (?P<dst>\S+)                    # target unit
    \s*$
    """,
    re.VERBOSE | re.IGNORECASE,
)


class ParseError(ValueError):
    """Raised when a conversion request cannot be understood."""


@dataclass(frozen=True)
class Request:
    value: Decimal
    from_unit: str
    to_unit: str


def parse(text):
    """Parse ``"<number> <unit> to <unit>"`` into a :class:`Request`."""
    match = _REQUEST.match(text)
    if match is None:
        raise ParseError(f"expected '<number> <unit> to <unit>', got {text!r}")
    return Request(
        value=Decimal(match["value"]),
        from_unit=match["src"],
        to_unit=match["dst"],
    )


def evaluate(text, places=DEFAULT_PLACES):
    """Parse ``text`` and perform the conversion it describes."""
    request = parse(text)
    return convert(request.value, request.from_unit, request.to_unit, places=places)
