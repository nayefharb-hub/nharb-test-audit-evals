from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date


@dataclass(frozen=True)
class Room:
    id: str
    name: str
    capacity: int
    nightly_rate: int  # cents


@dataclass
class Booking:
    id: int
    room_id: str
    guest_name: str
    start: date
    end: date
    party_size: int
    total: int  # cents
    status: str = field(default="confirmed")

    @property
    def nights(self) -> int:
        return (self.end - self.start).days

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "room_id": self.room_id,
            "guest_name": self.guest_name,
            "start": self.start.isoformat(),
            "end": self.end.isoformat(),
            "party_size": self.party_size,
            "total": self.total,
            "status": self.status,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Booking":
        return cls(
            id=int(data["id"]),
            room_id=data["room_id"],
            guest_name=data["guest_name"],
            start=date.fromisoformat(data["start"]),
            end=date.fromisoformat(data["end"]),
            party_size=int(data["party_size"]),
            total=int(data["total"]),
            status=data.get("status", "confirmed"),
        )
