# roombook

A small HTTP API for booking the meeting rooms in our office. No framework, no
database: bookings live in memory and the service is restarted nightly.

## Running

```sh
npm install
npm start            # listens on $PORT, default 3000
```

`HOLIDAY_COUNTRY` (default `GB`) selects the public holiday calendar.

## Rooms

| id      | capacity | € / hour |
|---------|---------:|---------:|
| `dune`  | 20       | 60       |
| `atlas` | 12       | 40       |
| `birch` | 6        | 25       |
| `cedar` | 4        | 18       |

## Behaviour

**Bookings** (`POST /bookings`)

- `start` and `end` must be ISO-8601 timestamps with an offset (`Z` or `+02:00`).
  Local times without an offset are rejected.
- A booking must be at least 15 minutes and at most 4 hours long, and may not
  start in the past.
- `attendees` may not exceed the room's capacity; `organizer` is required.
- Two bookings for the same room may not overlap. A booking may start exactly
  when the previous one ends.
- A booking can be moved with `PATCH /bookings/:id`; the same rules apply.
- `DELETE /bookings/:id` cancels a booking, up to one hour before it starts.
- `GET /bookings/:id/ical` returns the booking as an iCalendar file.

**Availability** (`GET /rooms/:id/availability?date=YYYY-MM-DD`)

Free half-hour slots between 08:00 and 18:00 UTC. Public holidays have no
slots. Holidays come from the [Nager.Date](https://date.nager.at) API and are
cached per year.

**Quotes** (`GET /rooms/:id/quote?start=…&end=…[&member=true]`)

Room time is billed per started half hour at the room's hourly rate. Bookings
shorter than an hour pay a €15 setup fee. Members get 10% off the room time.

## Other endpoints

- `GET /health`
- `GET /rooms[?minCapacity=n]` — largest room first
- `GET /rooms/:id`, `GET /rooms/:id/bookings`

## Tests

```sh
npm test
```
