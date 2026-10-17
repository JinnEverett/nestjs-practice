import http from 'node:http';
import { HttpError, sendJson } from './ex01.js';
import { parseJsonBody } from './ex02.js';

const REPLY = Symbol('reply');
export const reply = (status, body, headers = {}) => ({ [REPLY]: true, status, body, headers });

const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH']);

function parseQuery(searchParams) {
  const query = {};
  for (const [key, value] of searchParams) {
    if (Object.hasOwn(query, key)) query[key] = [].concat(query[key], value);
    else query[key] = value;
  }
  return query;
}

export function createApp(router, options = {}) {
  async function handle(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const found = router.match(req.method, url.pathname);
    if (found.notFound) return sendJson(res, 404, { error: 'Not Found' });
    if (found.methodNotAllowed) {
      return sendJson(res, 405, { error: 'Method Not Allowed' }, { Allow: found.allow.join(', ') });
    }
    const body = BODY_METHODS.has(req.method)
      ? await parseJsonBody(req, { limit: options.bodyLimit })
      : undefined;
    const result = await found.handler({ req, res, params: found.params, query: parseQuery(url.searchParams), body });
    if (res.headersSent) return;
    if (result === undefined) return sendJson(res, 204, undefined);
    if (result?.[REPLY]) return sendJson(res, result.status, result.body, result.headers);
    return sendJson(res, 200, result);
  }

  return http.createServer((req, res) => {
    handle(req, res).catch((err) => {
      if (res.headersSent) {
        res.destroy();
        return;
      }
      if (err instanceof HttpError && err.expose) {
        sendJson(res, err.status, { error: err.message });
        return;
      }
      options.onError?.(err);
      sendJson(res, 500, { error: 'Internal Server Error' });
    });
  });
}
