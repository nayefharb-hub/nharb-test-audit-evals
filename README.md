# nudge

Schedule and send appointment reminders by email.

`nudge` works out *when* each reminder for an appointment should go out,
keeps track of which ones have been sent, and hands due reminders to an email
gateway. It is a library first; a small command line tool is included for
checking a schedule by hand.

```
pip install -e .[dev]
pytest
```

## Concepts

- **Appointment** – a contact (email address), a name, a timezone-aware start
  time and a list of *offsets*.
- **Offset** – how long before the start a reminder goes out. The default is
  `24h` and `2h`.
- **Reminder** – one planned message for one offset. A reminder is either
  pending or sent.

## Rules

1. **Offsets.** A reminder is due at `start - offset`. Offsets are written as
   compact durations: `30m`, `2h`, `1h30m`, `1d`. Offsets are measured in real
   elapsed time, so a `24h` reminder is always 24 hours before the start, even
   across a daylight-saving change.
2. **Quiet hours.** Nobody gets a reminder between 22:00 and 07:00 in the
   appointment's own time zone. Quiet hours start at 22:00 and run up to, but
   not including, 07:00: a reminder due at exactly 07:00 is sent at 07:00.
   A reminder that would fall in quiet hours is sent at **21:00 the evening
   before** instead.
3. **Merging.** If two offsets end up at the same moment (usually because both
   were moved to 21:00), only one reminder is sent.
4. **Past reminders.** Reminders whose time has already passed when the
   appointment is booked are not sent at all.
5. **Rescheduling** replaces the pending reminders with ones planned from the
   new start. Reminders that have already gone out are kept for the record.
6. **Cancelling** drops every pending reminder for that appointment.
7. **Monthly series** keep the original day of the month. An appointment on
   the 31st falls on the last day of shorter months and goes back to the 31st
   when the month allows it.

### Worked example

An appointment on **Tuesday 10 March 2026 at 08:30**, Europe/London, with the
default offsets `24h,2h`:

| Offset | `start - offset`        | Sent at                   | Why                       |
|--------|-------------------------|---------------------------|---------------------------|
| 24h    | Mon 9 March, 08:30      | **Mon 9 March, 08:30**    | outside quiet hours       |
| 2h     | Tue 10 March, 06:30     | **Mon 9 March, 21:00**    | 06:30 is in quiet hours   |

```
$ python -m nudge plan --start 2026-03-10T08:30 --tz Europe/London
     1d  2026-03-09T08:30:00+00:00
     2h  2026-03-09T21:00:00+00:00
```

## Library use

```python
from datetime import datetime
from zoneinfo import ZoneInfo

from nudge import BackgroundRunner, Dispatcher, ReminderStore, SmtpGateway, SystemClock

clock = SystemClock()
store = ReminderStore(clock)
store.add("ana@example.com", "Dental check-up",
          datetime(2026, 3, 10, 8, 30, tzinfo=ZoneInfo("Europe/London")))

dispatcher = Dispatcher(store, SmtpGateway("smtp.internal"), clock)
runner = BackgroundRunner(dispatcher, poll_interval=30)
runner.start()
```

`Dispatcher.tick()` sends everything that is due and can be called from your
own scheduler instead of using `BackgroundRunner`. Due reminders are sent in
order of their due time; each reminder is sent once.

Custom wording is registered with `nudge.templates.register_template(key,
subject, body)`; the placeholders `{name}`, `{date}` and `{time}` are filled
from the appointment.

## Command line

```
python -m nudge plan --start 2026-03-10T08:30 --tz Europe/London --offsets 24h,2h
python -m nudge plan --start 2026-03-10T08:30 --output plan.txt   # file is mode 600
python -m nudge parse-duration 1h30m                                # prints 5400
```
