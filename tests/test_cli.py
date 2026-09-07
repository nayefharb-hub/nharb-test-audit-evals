import subprocess
import sys

import pytest

from nudge.cli import main


@pytest.mark.parametrize(
    "text, seconds",
    [("90s", 90), ("2h", 7200), ("1h30m", 5400), ("1d", 86400)],
)
def test_parse_duration_command(text, seconds):
    result = subprocess.run(
        [sys.executable, "-m", "nudge", "parse-duration", text],
        capture_output=True,
        text=True,
        check=True,
    )
    assert result.stdout.strip() == str(seconds)


def test_parse_duration_command_rejects_garbage():
    result = subprocess.run(
        [sys.executable, "-m", "nudge", "parse-duration", "2 hours"],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 2
    assert "invalid duration" in result.stderr


def test_plan_command_prints_one_line_per_reminder(capsys):
    code = main(["plan", "--start", "2026-03-12T15:00", "--tz", "Europe/London",
                 "--offsets", "1d,30m"])

    assert code == 0
    assert capsys.readouterr().out.splitlines() == [
        "      1d  2026-03-11T15:00:00+00:00",
        "     30m  2026-03-12T14:30:00+00:00",
    ]


def test_plan_command_rejects_unknown_time_zone(capsys):
    code = main(["plan", "--start", "2026-03-12T15:00", "--tz", "Mars/Olympus_Mons"])

    assert code == 2
    assert "unknown time zone" in capsys.readouterr().err
