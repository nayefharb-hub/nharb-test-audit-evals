import stat
import sys

import pytest

from booking.export import to_ics, write_ics


def test_ics_uses_all_day_dates(booking):
    ics = to_ics(booking)
    assert "DTSTART;VALUE=DATE:20260503" in ics
    assert "DTEND;VALUE=DATE:20260506" in ics


def test_ics_lines_end_with_crlf(booking):
    ics = to_ics(booking)
    assert ics.endswith("END:VCALENDAR\r\n")
    assert "\n" not in ics.replace("\r\n", "")


def test_write_ics_round_trips(booking, tmp_path):
    path = write_ics(booking, tmp_path / "stay.ics")
    assert path.read_bytes().decode() == to_ics(booking)


@pytest.mark.skipif(sys.platform == "win32", reason="POSIX file modes are not enforced on Windows")
def test_write_ics_is_owner_only(booking, tmp_path):
    path = write_ics(booking, tmp_path / "stay.ics")
    assert stat.S_IMODE(path.stat().st_mode) == 0o600
