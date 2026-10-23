'use strict';

const http = require('http');
const { createApp } = require('../../src/app');
const { staticHolidayCalendar } = require('../../src/holidays');

// Fixed "now" for API tests so validation that depends on the clock is
// reproducible. Pick a Monday afternoon that is not a holiday.
const NOW = new Date('2026-10-12T15:00:00Z');

async function startServer(options = {}) {
  const app = createApp({
    clock: () => NOW,
    holidays: staticHolidayCalendar(['2026-12-25']),
    ...options,
  });
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  async function request(method, path, body) {
    const res = await fetch(base + path, {
      method,
      headers: body ? { 'content-type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    const json = res.headers.get('content-type') === 'application/json' && text ? JSON.parse(text) : text;
    return { status: res.status, body: json, headers: res.headers };
  }

  return {
    app,
    base,
    get: (p) => request('GET', p),
    post: (p, b) => request('POST', p, b),
    patch: (p, b) => request('PATCH', p, b),
    del: (p) => request('DELETE', p),
    close: () => new Promise((resolve) => {
      app.holds.clear();
      server.closeAllConnections();
      server.close(resolve);
    }),
  };
}

module.exports = { startServer, NOW };
