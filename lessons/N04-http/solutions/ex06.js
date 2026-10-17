import { createHash } from 'node:crypto';

const matches = (header, etag) => {
  const wanted = header.split(',').map((s) => s.trim().replace(/^W\//, ''));
  return wanted.includes('*') || wanted.includes(etag);
};

export function conditionalJson(req, res, body) {
  const payload = Buffer.from(JSON.stringify(body), 'utf8');
  const etag = `"${createHash('sha1').update(payload).digest('hex')}"`;
  const base = { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': payload.length };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(200, base);
    res.end(payload);
    return;
  }
  const inm = req.headers['if-none-match'];
  if (inm && matches(inm, etag)) {
    res.writeHead(304, { ETag: etag });
    res.end();
    return;
  }
  res.writeHead(200, { ...base, ETag: etag, 'Cache-Control': 'no-cache' });
  res.end(req.method === 'HEAD' ? undefined : payload);
}
