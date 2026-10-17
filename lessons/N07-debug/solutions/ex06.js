const LOCATION_RE = /^(.*):(\d+):(\d+)$/;

export function parseStack(stack) {
  const frames = [];
  for (const rawLine of String(stack).split(/\r?\n/)) {
    const m = /^\s*at\s+(.*)$/.exec(rawLine);
    if (!m) continue;
    let rest = m[1].trim();
    let async = false;
    if (rest.startsWith('async ')) {
      async = true;
      rest = rest.slice(6);
    }
    let fn = null;
    let location = rest;
    const paren = /^(.*?)\s+\((.*)\)$/.exec(rest);
    if (paren) {
      fn = paren[1].replace(/\s+\[as [^\]]+\]$/, '');
      location = paren[2];
    }
    const loc = LOCATION_RE.exec(location);
    const file = loc ? loc[1] : location;
    frames.push({
      fn,
      file,
      line: loc ? Number(loc[2]) : null,
      col: loc ? Number(loc[3]) : null,
      async,
      internal: file.startsWith('node:') || file === '<anonymous>',
      vendor: /[\\/]node_modules[\\/]/.test(file),
    });
  }
  return frames;
}

export function errorChain(err) {
  const out = [];
  const seen = new Set();
  const walk = (e, depth) => {
    if (depth > 10) return;
    if (e === null || typeof e !== 'object') {
      out.push({ name: 'NonError', message: String(e), depth });
      return;
    }
    if (seen.has(e)) return;
    seen.add(e);
    const entry = { name: e.name ?? 'Error', message: e.message ?? String(e), depth };
    if (e.code !== undefined) entry.code = e.code;
    out.push(entry);
    if (e.cause !== undefined) walk(e.cause, depth + 1);
    if (Array.isArray(e.errors)) for (const sub of e.errors) walk(sub, depth + 1);
  };
  walk(err, 0);
  return out;
}

export function firstAppFrame(err, { root } = {}) {
  const frames = parseStack(err?.stack ?? '');
  return frames.find((f) => !f.internal && !f.vendor && (!root || f.file.startsWith(root))) ?? null;
}
