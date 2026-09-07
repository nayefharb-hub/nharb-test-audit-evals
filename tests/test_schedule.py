from datetime import datetime, timedelta, timezone

import pytest

from nudge.schedule import plan_reminders

from conftest import LONDON

H = timedelta(hours=1)


def test_readme_example_moves_early_reminder_to_previous_evening():
    # Worked example from the README: Tue 10 March 2026, 08:30, offsets 24h and 2h.
    start = datetime(2026, 3, 10, 8, 30, tzinfo=LONDON)

    planned = plan_reminders(start, [24 * H, 2 * H])

    assert [p.at for p in planned] == [
        datetime(2026, 3, 9, 8, 30, tzinfo=LONDON),
        datetime(2026, 3, 9, 21, 0, tzinfo=LONDON),
    ]
    assert [p.offset for p in planned] == [24 * H, 2 * H]


def test_reminder_times_are_offsets_before_start():
    start = datetime(2026, 3, 12, 15, 0, tzinfo=LONDON)

    planned = plan_reminders(start, [24 * H, 2 * H])

    assert [p.at for p in planned] == [
        datetime(2026, 3, 11, 15, 0, tzinfo=LONDON),
        datetime(2026, 3, 12, 13, 0, tzinfo=LONDON),
    ]


def test_plan_is_ordered_by_send_time_not_by_offset():
    start = datetime(2026, 3, 12, 15, 0, tzinfo=LONDON)

    planned = plan_reminders(start, [2 * H, timedelta(minutes=30), 24 * H])

    assert [p.offset for p in planned] == [24 * H, 2 * H, timedelta(minutes=30)]


def test_reminders_already_in_the_past_are_dropped():
    start = datetime(2026, 3, 12, 15, 0, tzinfo=LONDON)
    now = datetime(2026, 3, 12, 9, 0, tzinfo=LONDON)

    planned = plan_reminders(start, [24 * H, 2 * H], now=now)

    assert [p.at for p in planned] == [datetime(2026, 3, 12, 13, 0, tzinfo=LONDON)]


def test_reminders_moved_to_the_same_evening_slot_are_merged():
    # 06:00 and 05:00 are both quiet, so both would move to 21:00 the day before.
    start = datetime(2026, 3, 12, 7, 30, tzinfo=LONDON)

    planned = plan_reminders(start, [timedelta(minutes=90), timedelta(minutes=150)])

    assert planned == [(timedelta(minutes=150), datetime(2026, 3, 11, 21, 0, tzinfo=LONDON))]


def test_no_reminder_is_scheduled_after_its_appointment():
    start = datetime(2026, 3, 12, 15, 0, tzinfo=LONDON)
    now = datetime(2026, 3, 13, 9, 0, tzinfo=LONDON)

    for planned in plan_reminders(start, [24 * H, 2 * H, 10 * timedelta(minutes=1)], now=now):
        assert planned.at < start


@pytest.mark.xfail(
    strict=True,
    reason="offsets are subtracted in local wall-clock time, so a 24h reminder "
    "across the March clock change is only 23h early (#52)",
)
def test_offsets_measure_real_elapsed_time_across_dst_change():
    # Clocks go forward in London at 01:00 on Sunday 29 March 2026.
    start = datetime(2026, 3, 29, 9, 0, tzinfo=LONDON)

    (planned,) = plan_reminders(start, [24 * H])

    elapsed = start.astimezone(timezone.utc) - planned.at.astimezone(timezone.utc)
    assert elapsed == 24 * H
    assert planned.at == datetime(2026, 3, 28, 8, 0, tzinfo=LONDON)


def test_naive_start_is_rejected():
    with pytest.raises(ValueError, match="timezone-aware"):
        plan_reminders(datetime(2026, 3, 12, 15, 0), [2 * H])


def test_non_positive_offset_is_rejected():
    start = datetime(2026, 3, 12, 15, 0, tzinfo=LONDON)
    with pytest.raises(ValueError, match="positive"):
        plan_reminders(start, [timedelta(0)])
