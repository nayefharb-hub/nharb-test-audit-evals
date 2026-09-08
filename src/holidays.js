'use strict';

const DEFAULT_BASE_URL = 'https://date.nager.at/api/v3';

// Public holiday calendar backed by the Nager.Date API. Results are cached
// per year so availability lookups only hit the network once per year.
function createHolidayCalendar({ country = 'GB', baseUrl = DEFAULT_BASE_URL, fetchImpl = globalThis.fetch, timeoutMs = 5000 } = {}) {
  const cache = new Map();

  async function load(year) {
    if (cache.has(year)) return cache.get(year);
    const pending = (async () => {
      const res = await fetchImpl(`${baseUrl}/PublicHolidays/${year}/${country}`, {
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) throw new Error(`holiday feed returned ${res.status}`);
      const body = await res.json();
      return body
        .filter((h) => h.global || (h.counties || []).includes(`${country}-ENG`))
        .map((h) => ({ date: h.date, name: h.name }));
    })();
    cache.set(year, pending);
    pending.catch(() => cache.delete(year));
    return pending;
  }

  return {
    country,
    list: (year) => load(year),
    async isHoliday(date) {
      const year = Number(date.slice(0, 4));
      const list = await load(year);
      return list.some((h) => h.date === date);
    },
  };
}

function staticHolidayCalendar(dates = []) {
  const set = new Set(dates);
  return {
    country: 'static',
    list: async () => [...set].map((date) => ({ date, name: 'Holiday' })),
    isHoliday: async (date) => set.has(date),
  };
}

module.exports = { createHolidayCalendar, staticHolidayCalendar };
