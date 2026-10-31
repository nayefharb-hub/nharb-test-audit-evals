from datetime import date, datetime

import pytest

from booking.cancellation import CancellationError, check_in_at, refund_amount

START = date(2026, 7, 10)  # check-in 2026-07-10 15:00


def test_check_in_is_three_in_the_afternoon():
    assert check_in_at(START) == datetime(2026, 7, 10, 15, 0)


@pytest.mark.parametrize(
    "now, expected",
    [
        (datetime(2026, 7, 7, 9, 0), 30000),    # 78h notice
        (datetime(2026, 7, 8, 15, 0), 30000),   # exactly 48h
        (datetime(2026, 7, 8, 15, 1), 15000),   # just under 48h
        (datetime(2026, 7, 9, 15, 0), 15000),   # exactly 24h
        (datetime(2026, 7, 9, 15, 1), 0),       # just under 24h
        (datetime(2026, 7, 10, 14, 59), 0),
    ],
)
def test_refund_tiers(now, expected):
    assert refund_amount(30000, START, now) == expected


def test_half_refund_rounds_half_cent_up():
    assert refund_amount(9999, START, datetime(2026, 7, 9, 9, 0)) == 5000


def test_cannot_cancel_once_stay_has_started():
    with pytest.raises(CancellationError):
        refund_amount(30000, START, datetime(2026, 7, 10, 15, 0))
