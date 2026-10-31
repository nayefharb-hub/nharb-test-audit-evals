"""The web client and the partner feed both consume this shape; change it with care."""
from booking.models import Booking

EXPECTED_KEYS = {"id", "room_id", "guest_name", "start", "end", "party_size", "total", "status"}


def test_payload_has_exactly_the_published_keys(booking):
    assert set(booking.to_dict()) == EXPECTED_KEYS


def test_payload_dates_are_iso_8601(booking):
    payload = booking.to_dict()
    assert payload["start"] == "2026-05-03"
    assert payload["end"] == "2026-05-06"


def test_payload_round_trips(booking):
    assert Booking.from_dict(booking.to_dict()) == booking


def test_missing_status_defaults_to_confirmed(booking):
    payload = booking.to_dict()
    del payload["status"]
    assert Booking.from_dict(payload).status == "confirmed"
