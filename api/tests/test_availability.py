from datetime import date

import pytest

from booking.availability import available_rooms, nights, overlaps
from booking.models import Booking


def _booking(room_id, start, end, status="confirmed"):
    return Booking(
        id=1, room_id=room_id, guest_name="x", start=start, end=end,
        party_size=1, total=0, status=status,
    )


def test_nights_counts_half_open_range():
    assert nights(date(2026, 5, 3), date(2026, 5, 5)) == 2


@pytest.mark.parametrize("end", [date(2026, 5, 3), date(2026, 5, 2)])
def test_nights_rejects_empty_or_reversed_range(end):
    with pytest.raises(ValueError):
        nights(date(2026, 5, 3), end)


def test_back_to_back_stays_do_not_overlap():
    assert not overlaps(date(2026, 5, 3), date(2026, 5, 5), date(2026, 5, 5), date(2026, 5, 7))


def test_stay_inside_another_overlaps():
    assert overlaps(date(2026, 5, 1), date(2026, 5, 10), date(2026, 5, 4), date(2026, 5, 5))


def test_available_rooms_filters_by_capacity(rooms):
    found = available_rooms(rooms, [], date(2026, 6, 1), date(2026, 6, 3), party_size=3)
    assert [r.id for r in found] == ["garden-1"]


def test_available_rooms_excludes_booked_rooms(rooms):
    taken = [_booking("harbour-1", date(2026, 6, 2), date(2026, 6, 4))]
    found = available_rooms(rooms, taken, date(2026, 6, 1), date(2026, 6, 3), party_size=1)
    assert [r.id for r in found] == ["garden-1", "attic"]


def test_cancelled_bookings_free_the_room(rooms):
    taken = [_booking("attic", date(2026, 6, 1), date(2026, 6, 3), status="cancelled")]
    found = available_rooms(rooms, taken, date(2026, 6, 1), date(2026, 6, 3), party_size=1)
    assert "attic" in [r.id for r in found]
