from __future__ import annotations

import os
from pathlib import Path

from .models import Booking


def to_ics(booking: Booking) -> str:
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Harbour Stays//Booking//EN",
        "BEGIN:VEVENT",
        f"UID:booking-{booking.id}@harbourstays",
        f"DTSTART;VALUE=DATE:{booking.start:%Y%m%d}",
        f"DTEND;VALUE=DATE:{booking.end:%Y%m%d}",
        f"SUMMARY:Stay for {booking.guest_name} ({booking.room_id})",
        "END:VEVENT",
        "END:VCALENDAR",
    ]
    return "\r\n".join(lines) + "\r\n"


def write_ics(booking: Booking, path: Path) -> Path:
    path = Path(path)
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w", newline="") as fh:
        fh.write(to_ics(booking))
    os.chmod(path, 0o600)
    return path
