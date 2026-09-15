from datetime import datetime

import pytest
from dateutil.relativedelta import relativedelta

from nudge.series import monthly_starts

from conftest import LONDON


def test_gh77_monthly_series_keeps_original_day_after_short_month():
    first = datetime(2026, 1, 31, 10, 0, tzinfo=LONDON)

    starts = monthly_starts(first, 4)

    assert [s.date().isoformat() for s in starts] == [
        "2026-01-31", "2026-02-28", "2026-03-31", "2026-04-30",
    ]
    assert {s.time().isoformat() for s in starts} == {"10:00:00"}


def test_relativedelta_clamps_to_end_of_month():
    assert datetime(2026, 1, 31) + relativedelta(months=1) == datetime(2026, 2, 28)
    assert datetime(2028, 1, 31) + relativedelta(months=1) == datetime(2028, 2, 29)


def test_series_needs_at_least_one_occurrence():
    with pytest.raises(ValueError):
        monthly_starts(datetime(2026, 1, 31, 10, 0, tzinfo=LONDON), 0)


def test_series_occurrences_share_a_series_id(store):
    appts = store.add_monthly_series("ana@example.com", "Physio",
                                     datetime(2026, 3, 16, 10, 0, tzinfo=LONDON), 3)

    assert len({a.series_id for a in appts}) == 1
    assert store.series(appts[0].series_id) == appts


def test_cancel_one_occurrence_keeps_the_rest(store):
    appts = store.add_monthly_series("ana@example.com", "Physio",
                                     datetime(2026, 3, 16, 10, 0, tzinfo=LONDON), 3)

    store.cancel_occurrence(appts[0].series_id, 1)

    assert [a.status for a in store.series(appts[0].series_id)] == [
        "scheduled", "cancelled", "scheduled",
    ]
    assert store.pending(appts[2].id)
