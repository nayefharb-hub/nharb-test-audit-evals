from datetime import date, datetime

import pytest

from booking.models import Room
from booking.store import (
    BookingStore,
    CapacityError,
    OverlapError,
    UnknownRoomError,
)

store = BookingStore()
store.add_room(Room(id="harbour-1", name="Harbour View", capacity=2, nightly_rate=12000))


def test_create_booking_prices_the_stay():
    booking = store.create_booking(
        "harbour-1", "Grace Hopper", date(2026, 8, 1), date(2026, 8, 4), party_size=2
    )
    assert booking.id == 1
    assert booking.total == 36000
    assert booking.status == "confirmed"


def test_get_returns_stored_booking():
    assert store.get(1).guest_name == "Grace Hopper"


def test_overlapping_booking_is_rejected():
    with pytest.raises(OverlapError):
        store.create_booking(
            "harbour-1", "Alan Turing", date(2026, 8, 3), date(2026, 8, 5), party_size=1
        )


def test_party_larger_than_room_is_rejected():
    try:
        store.create_booking(
            "harbour-1", "Big Family", date(2026, 9, 1), date(2026, 9, 2), party_size=5
        )
    except CapacityError:
        pass


def test_unknown_room_is_rejected():
    with pytest.raises(UnknownRoomError):
        store.create_booking("penthouse", "x", date(2026, 9, 1), date(2026, 9, 2), 1)


def test_cancel_marks_booking_and_returns_refund(store):
    booking = store.create_booking(
        "garden-1", "Edsger Dijkstra", date(2026, 10, 10), date(2026, 10, 12), party_size=2
    )
    refund = store.cancel(booking.id, now=datetime(2026, 10, 1, 12, 0))
    assert refund == 19000
    assert store.get(booking.id).status == "cancelled"


def test_cancelled_booking_frees_dates(store):
    first = store.create_booking("attic", "a", date(2026, 11, 1), date(2026, 11, 3), 1)
    store.cancel(first.id, now=datetime(2026, 10, 1))
    second = store.create_booking("attic", "b", date(2026, 11, 1), date(2026, 11, 3), 1)
    assert second.status == "confirmed"
