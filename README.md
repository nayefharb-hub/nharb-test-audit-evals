# Harbour Stays

Booking for small guesthouses: guests search for a room, pick their dates, and
book. Owners can see what is booked and cancel on a guest's behalf.

This repository is a monorepo with two packages.

| Package | Language | What it does |
| ------- | -------- | ------------ |
| [`api/`](api/) | Python 3.11+ | Rooms, bookings, availability search, cancellation and refunds, calendar export |
| [`web/`](web/) | JavaScript (Node 20) | Booking form validation, date-range picker logic, price display |

## Behaviour

### Bookings and availability (`api`)

- Stays are **half-open date ranges**: a booking from the 3rd to the 5th covers
  the nights of the 3rd and the 4th. A guest checking out on the 5th does not
  clash with another checking in on the 5th.
- A booking must cover at least one night.
- A room cannot be double-booked, and a booking cannot exceed the room's
  capacity.
- Availability search returns the rooms that are free for the whole stay and
  can hold the party.

### Cancellation (`api`)

Check-in is at 15:00 on the first day of the stay. Refunds depend on how long
before check-in the guest cancels:

| Notice before check-in | Refund |
| ---------------------- | ------ |
| 48 hours or more | 100% |
| 24 to 48 hours | 50% |
| Less than 24 hours | none |

A stay that has already started cannot be cancelled. Half refunds round half a
cent up.

### Calendar export (`api`)

A confirmed booking can be exported as an `.ics` file. The file is written
readable by its owner only, since it contains the guest's name.

### Booking form (`web`)

- Name is required; email must look like an address; party size must be
  between 1 and the room's capacity.
- The date-range picker will not allow check-in in the past, a stay shorter
  than one night, or one longer than 30 nights.

### Price display (`web`)

- Prices are held in cents and displayed in the guest's locale and the
  property's currency.
- Friday and Saturday nights carry a weekend surcharge on the nightly rate.

## Development

```sh
# api
cd api
python -m venv .venv && . .venv/bin/activate
pip install -e '.[test]'
pytest

# web
cd web
npm ci
npm test
```

## Continuous integration

Every push and pull request runs the test suites through GitHub Actions
(`.github/workflows/ci.yml`). Keep `main` green.
