import { randomUUID } from 'node:crypto';

const VALID_ID = /^[A-Za-z0-9_-]{8,64}$/;

export function requestId() {
  return (req, res, next) => {
    const incoming = req.get('x-request-id');
    req.id = incoming && VALID_ID.test(incoming) ? incoming : randomUUID();
    res.setHeader('X-Request-Id', req.id);
    next();
  };
}

export function accessLog(sink) {
  return (req, res, next) => {
    const start = performance.now();
    let logged = false;
    const done = () => {
      if (logged) return; // 'finish' và 'close' có thể cùng phát
      logged = true;
      sink({ id: req.id, method: req.method, url: req.originalUrl, status: res.statusCode, ms: performance.now() - start });
    };
    res.on('finish', done);
    res.on('close', done);
    next();
  };
}
