'use strict';

// Minimal static file server plus an in-memory list store.
// Lists live only as long as the process; there is no database.

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 4173;
const ROOT = path.join(__dirname, 'public');
const MAX_BODY = 64 * 1024;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// id -> { rev, todos }
const lists = new Map();

// Saves are slowed down a little so the "Saving…" state is visible during
// development, roughly what users see on a hosted instance.
const SAVE_LATENCY_MS = Number(process.env.SAVE_LATENCY_MS ?? 120);

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error('body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function handleApi(req, res, id) {
  if (!/^[a-z0-9-]{1,64}$/.test(id)) {
    sendJson(res, 400, { error: 'invalid list id' });
    return;
  }

  if (req.method === 'GET') {
    const list = lists.get(id) || { rev: 0, todos: [] };
    sendJson(res, 200, list);
    return;
  }

  if (req.method === 'PUT') {
    let payload;
    try {
      payload = JSON.parse(await readBody(req));
    } catch {
      sendJson(res, 400, { error: 'invalid body' });
      return;
    }
    if (!Array.isArray(payload.todos) || typeof payload.rev !== 'number') {
      sendJson(res, 400, { error: 'invalid body' });
      return;
    }

    const delay = Math.round(Math.random() * SAVE_LATENCY_MS);
    setTimeout(() => {
      const current = lists.get(id);
      // Ignore writes that arrive out of order.
      if (!current || payload.rev > current.rev) {
        lists.set(id, { rev: payload.rev, todos: payload.todos });
      }
      sendJson(res, 200, lists.get(id));
    }, delay);
    return;
  }

  res.writeHead(405, { Allow: 'GET, PUT' });
  res.end();
}

function serveStatic(req, res, pathname) {
  const rel = pathname === '/' ? 'index.html' : pathname.slice(1);
  const file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT)) {
    res.writeHead(403);
    res.end();
    return;
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  const match = pathname.match(/^\/api\/lists\/([^/]+)$/);
  if (match) {
    handleApi(req, res, match[1]).catch(() => sendJson(res, 500, { error: 'server error' }));
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405);
    res.end();
    return;
  }
  serveStatic(req, res, pathname);
});

server.listen(PORT, () => {
  console.log(`Tally running at http://localhost:${PORT}`);
});
