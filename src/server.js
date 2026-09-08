'use strict';

const http = require('http');
const { createApp } = require('./app');
const { createHolidayCalendar } = require('./holidays');

const port = Number(process.env.PORT || 3000);
const app = createApp({ holidays: createHolidayCalendar({ country: process.env.HOLIDAY_COUNTRY || 'GB' }) });

http.createServer(app).listen(port, () => {
  console.log(`roombook listening on :${port}`);
});
