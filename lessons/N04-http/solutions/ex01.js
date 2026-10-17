export class HttpError extends Error {
  constructor(status, message, { cause, expose = status < 500 } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = 'HttpError';
    this.status = status;
    this.expose = expose;
  }
}

export function sendJson(res, status, body, headers = {}) {
  if (body === undefined) {
    res.writeHead(status, { 'Content-Length': 0, ...headers });
    res.end();
    return;
  }
  const payload = Buffer.from(JSON.stringify(body), 'utf8');
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': payload.length, // số BYTE, không phải số ký tự
    ...headers,
  });
  res.end(payload);
}
