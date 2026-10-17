import { HttpError } from './ex01.js';

const trimSlash = (p) => (p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p);

function compile(pattern) {
  const segs = trimSlash(pattern).split('/').slice(1);
  return segs; // '' cho gốc '/'
}

function matchSegments(segs, path) {
  const parts = trimSlash(path).split('/').slice(1);
  if (segs.length !== parts.length) return null;
  const params = {};
  for (let i = 0; i < segs.length; i++) {
    if (segs[i].startsWith(':')) {
      if (parts[i] === '') return null;
      params[segs[i].slice(1)] = parts[i];
    } else if (segs[i] !== parts[i]) {
      return null;
    }
  }
  return params;
}

const decode = (params) => {
  try {
    return Object.fromEntries(Object.entries(params).map(([k, v]) => [k, decodeURIComponent(v)]));
  } catch (cause) {
    throw new HttpError(400, 'Bad Request', { cause });
  }
};

export function createRouter() {
  const routes = [];
  return {
    add(method, pattern, handler) {
      routes.push({ method: method.toUpperCase(), segs: compile(pattern), handler });
      return this;
    },
    match(method, pathname) {
      const verb = method.toUpperCase();
      const allow = new Set();
      for (const r of routes) {
        const params = matchSegments(r.segs, pathname);
        if (!params) continue;
        if (r.method === verb) return { handler: r.handler, params: decode(params) };
        allow.add(r.method);
      }
      if (allow.size > 0) return { methodNotAllowed: true, allow: [...allow].sort() };
      return { notFound: true };
    },
  };
}
