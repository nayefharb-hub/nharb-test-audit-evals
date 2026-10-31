from __future__ import annotations

from datetime import date, datetime
from itertools import count

from .availability import is_free, nights
from .cancellation import refund_amount
from .models import Booking, Room


class BookingError(Exception):
    pass


class OverlapError(BookingError):
    pass


class CapacityError(BookingError):
    pass


class UnknownRoomError(BookingError):
    pass


class BookingStore:
    """In-memory booking store. The HTTP layer wraps one of these per property."""

    def __init__(self) -> None:
        self.rooms: dict[str, Room] = {}
        self.bookings: dict[int, Booking] = {}
        self._ids = count(1)

    def add_room(self, room: Room) -> None:
        self.rooms[room.id] = room

    def create_booking(
        self,
        room_id: str,
        guest_name: str,
        start: date,
        end: date,
        party_size: int,
    ) -> Booking:
        room = self.rooms.get(room_id)
        if room is None:
            raise UnknownRoomError(room_id)
        stay = nights(start, end)
        if not is_free(room_id, self.bookings.values(), start, end):
            raise OverlapError(f"{room_id} is already booked for those dates")
        booking = Booking(
            id=next(self._ids),
            room_id=room_id,
            guest_name=guest_name,
            start=start,
            end=end,
            party_size=party_size,
            total=stay * room.nightly_rate,
        )
        self.bookings[booking.id] = booking
        return booking

    def get(self, booking_id: int) -> Booking:
        return self.bookings[booking_id]

    def cancel(self, booking_id: int, now: datetime) -> int:
        booking = self.bookings[booking_id]
        refund = refund_amount(booking.total, booking.start, now)
        booking.status = "cancelled"
        return refund
