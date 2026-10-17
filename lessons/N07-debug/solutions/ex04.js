const LEVELS = { trace: 10, debug: 20, info: 30, warn: 40, error: 50, fatal: 60 };
const DEFAULT_REDACT = ['password', 'token', 'authorization', 'cookie', 'secret', 'apikey', 'api_key'];
const CORE = new Set(['level', 'time', 'msg']);

function normalize(value, redact, ancestors) {
  if (value instanceof Error) {
    if (ancestors.has(value)) return '[Circular]';
    ancestors.add(value);
    const out = { type: value.name, message: value.message, stack: value.stack };
    if (value.code !== undefined) out.code = value.code;
    if (value.cause !== undefined) out.cause = normalize(value.cause, redact, ancestors);
    ancestors.delete(value);
    return out;
  }
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  switch (typeof value) {
    case 'bigint': return value.toString();
    case 'function': case 'symbol': case 'undefined': return undefined;
    case 'object': break;
    default: return value;
  }
  if (value === null) return null;
  if (ancestors.has(value)) return '[Circular]';
  ancestors.add(value);
  let out;
  if (Array.isArray(value)) {
    out = value.map((v) => normalize(v, redact, ancestors) ?? null);
  } else {
    out = {};
    for (const [k, v] of Object.entries(value)) {
      if (redact.has(k.toLowerCase())) { out[k] = '[REDACTED]'; continue; }
      const n = normalize(v, redact, ancestors);
      if (n !== undefined) out[k] = n;
    }
  }
  ancestors.delete(value);
  return out;
}

export function createLogger(options = {}) {
  const { level = 'info', sink, base = {}, now = Date.now } = options;
  const redact = options.redactSet ?? new Set([...DEFAULT_REDACT, ...(options.redact ?? [])].map((k) => k.toLowerCase()));
  const threshold = LEVELS[level] ?? LEVELS.info;

  function write(name, msg, fields) {
    if (LEVELS[name] < threshold) return;
    const merged = fields instanceof Error ? { err: fields } : (fields ?? {});
    const line = { level: name, time: new Date(now()).toISOString(), msg };
    const extras = normalize({ ...base, ...merged }, redact, new Set()) ?? {};
    for (const [k, v] of Object.entries(extras)) if (!CORE.has(k)) line[k] = v;
    let text;
    try {
      text = JSON.stringify(line);
    } catch {
      text = JSON.stringify({ level: name, time: line.time, msg, logError: 'unserializable fields' });
    }
    sink(text);
  }

  const logger = { isLevelEnabled: (l) => LEVELS[l] >= threshold };
  for (const name of Object.keys(LEVELS)) logger[name] = (msg, fields) => write(name, msg, fields);
  logger.child = (bindings) => createLogger({ ...options, base: { ...base, ...bindings }, redactSet: redact });
  return logger;
}
