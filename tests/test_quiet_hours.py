from datetime import datetime, time, timedelta

from nudge.schedule import in_quiet_hours, plan_reminders, shift_out_of_quiet_hours

from conftest import LONDON

H = timedelta(hours=1)


def test_daytime_reminders_are_left_alone():
    start = datetime(2026, 3, 12, 15, 0, tzinfo=LONDON)

    planned = plan_reminders(start, [24 * H, 2 * H])

    assert [p.at for p in planned] == [
        datetime(2026, 3, 11, 15, 0, tzinfo=LONDON),
        datetime(2026, 3, 12, 13, 0, tzinfo=LONDON),
    ]


def test_late_evening_reminder_moves_to_nine_pm_same_day():
    at = datetime(2026, 3, 11, 22, 30, tzinfo=LONDON)

    assert shift_out_of_quiet_hours(at) == datetime(2026, 3, 11, 21, 0, tzinfo=LONDON)


def test_small_hours_reminder_moves_to_previous_evening():
    at = datetime(2026, 3, 12, 3, 15, tzinfo=LONDON)

    assert shift_out_of_quiet_hours(at) == datetime(2026, 3, 11, 21, 0, tzinfo=LONDON)


def test_quiet_hours_start_at_ten_pm():
    assert in_quiet_hours(time(22, 0))
    assert not in_quiet_hours(time(21, 59))


def test_two_hour_reminder_for_nine_am_appointment():
    start = datetime(2026, 3, 12, 9, 0, tzinfo=LONDON)

    (planned,) = plan_reminders(start, [2 * H])

    assert planned.at == datetime(2026, 3, 11, 21, 0, tzinfo=LONDON)
