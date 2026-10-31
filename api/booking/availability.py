from __future__ import annotations

from datetime import date
from typing import Iterable

from .models import Booking, Room


def nights(start: date, end: date) -> int:
    """Number of nights in the half-open stay [start, end)."""
    if end <= start:
        raise ValueError("a stay must end after it starts")
    return (end - start).days


def overlaps(a_start: date, a_end: date, b_start: date, b_end: date) -> bool:
    # Half-open ranges: checking out on the day someone else checks in is fine.
    return a_start < b_end and b_start < a_end


def is_free(room_id: str, bookings: Iterable[Booking], start: date, end: date) -> bool:
    return not any(
        b.room_id == room_id
        and b.status == "confirmed"
        and overlaps(start, end, b.start, b.end)
        for b in bookings
    )


def available_rooms(
    rooms: Iterable[Room],
    bookings: Iterable[Booking],
    start: date,
    end: date,
    party_size: int,
) -> list[Room]:
    nights(start, end)  # validates the range
    bookings = list(bookings)
    return [
        room
        for room in rooms
        if room.capacity >= party_size and is_free(room.id, bookings, start, end)
    ]
