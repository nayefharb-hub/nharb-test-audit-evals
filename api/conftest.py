from datetime import date

import pytest

from booking.models import Booking, Room
from booking.store import BookingStore


@pytest.fixture
def rooms():
    return [
        Room(id="harbour-1", name="Harbour View", capacity=2, nightly_rate=12000),
        Room(id="garden-1", name="Garden Room", capacity=4, nightly_rate=9500),
        Room(id="attic", name="Attic", capacity=1, nightly_rate=6000),
    ]


@pytest.fixture
def store(rooms):
    s = BookingStore()
    for room in rooms:
        s.add_room(room)
    return s


@pytest.fixture
def booking():
    return Booking(
        id=7,
        room_id="garden-1",
        guest_name="Ada Lovelace",
        start=date(2026, 5, 3),
        end=date(2026, 5, 6),
        party_size=3,
        total=28500,
    )
