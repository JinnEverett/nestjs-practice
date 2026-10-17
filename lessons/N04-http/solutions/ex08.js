import { sendJson } from './ex01.js';

export function createRateLimiter({ limit, windowMs, now = Date.now, trustProxy = false }) {
  const clients = new Map(); // id → { count, resetAt }
  let lastSweep = now();

  const sweep = (t) => {
    if (t - lastSweep < windowMs) return;
    lastSweep = t;
    for (const [id, c] of clients) if (c.resetAt <= t) clients.delete(id);
  };

  const clientId = (req) => {
    if (trustProxy) {
      const xff = req.headers['x-forwarded-for'];
      if (xff) return String(xff).split(',')[0].trim();
    }
    return req.socket.remoteAddress ?? 'unknown';
  };

  function check(req, res) {
    const t = now();
    sweep(t);
    const id = clientId(req);
    let entry = clients.get(id);
    if (!entry || entry.resetAt <= t) {
      entry = { count: 0, resetAt: t + windowMs };
      clients.set(id, entry);
    }
    entry.count++;
    const headers = {
      'X-RateLimit-Limit': String(limit),
      'X-RateLimit-Remaining': String(Math.max(0, limit - entry.count)),
    };
    if (entry.count > limit) {
      sendJson(res, 429, { error: 'Too Many Requests' }, {
        ...headers,
        'Retry-After': String(Math.ceil((entry.resetAt - t) / 1000)),
      });
      return true;
    }
    for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
    return false;
  }
  check.size = () => clients.size;
  return check;
}
