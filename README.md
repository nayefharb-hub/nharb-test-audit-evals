# Tally

Tally is a small to-do list that runs in the browser. It is meant for
households and small teams who want one shared list (groceries, chores, a
packing list) without accounts, apps or setup. Open the page, type, and send the
link to whoever else needs the list.

## What it does

- **Add items.** Type in the box and press Enter. Leading and trailing spaces
  are removed and runs of spaces collapse to one. Empty input is rejected with
  the message "Type something first." Titles are limited to 100 characters;
  anything longer is cut off.
- **Complete items.** Tick the checkbox next to an item to mark it done. Done
  items are struck through and can be unticked again.
- **Edit items.** Double-click an item's text to edit it. Enter saves the change.
  Escape cancels the edit and keeps the old text. Clearing the text and
  pressing Enter removes the item. The 100-character limit applies to edits too.
- **Delete items.** Each item has a Delete button. Tally asks for confirmation
  once before deleting.
- **Counter.** The footer shows how many items are not done yet, e.g.
  "1 item left", "3 items left", "0 items left". The footer is hidden while the
  list is empty.
- **Filters.** All, Active and Completed filter the list. The filter is part of
  the URL (`#/active`, `#/completed`), so it survives a reload and can be
  bookmarked.
- **Clear completed.** Removes every completed item after asking for
  confirmation. The button only appears when something is completed.
- **Saving.** Every change is saved to the server straight away. The header
  shows "Saving…" while a save is in flight and "Saved" once everything has
  been stored.
- **Sharing.** Each browser gets its own list. The link under the list
  (`/?list=<id>`) opens the same list anywhere, so several people can work on
  one list. Reloading the page brings the list back.

Lists are kept in the server's memory, so restarting the server empties them.
That is fine for the households we built this for; persistent storage is on the
roadmap.

## Running it

Requires Node 20 or newer. There are no runtime dependencies.

```sh
npm start
# Tally running at http://localhost:4173
```

Set `PORT` to use another port. `SAVE_LATENCY_MS` (default 120) adds up to that
many milliseconds of delay to each save, which is roughly what the hosted
instance feels like; set it to `0` to turn it off.

## Project layout

```
public/       the page: index.html, app.js, styles.css
server.js     static files + the in-memory list API
```

### API

| Method | Path              | Body / response                         |
| ------ | ----------------- | --------------------------------------- |
| GET    | `/api/lists/:id`  | `{ rev, todos: [{ id, title, completed }] }` |
| PUT    | `/api/lists/:id`  | same shape; writes with an older `rev` are ignored |
