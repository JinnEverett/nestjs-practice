export class ConfigError extends Error {
  constructor(errors) {
    super(`Invalid configuration: ${errors.map((e) => e.key).join(', ')}`);
    this.name = 'ConfigError';
    this.errors = errors;
  }
}

const TRUE = new Set(['true', '1', 'yes', 'on']);
const FALSE = new Set(['false', '0', 'no', 'off']);

/** Trả { value } hoặc { error } — error KHÔNG chứa giá trị gốc (có thể là secret). */
function coerce(raw, rule) {
  switch (rule.type) {
    case 'string':
      return { value: raw };
    case 'int': {
      if (!/^-?\d+$/.test(raw)) return { error: 'must be an integer' };
      const n = Number(raw);
      if (!Number.isSafeInteger(n)) return { error: 'must be a safe integer' };
      if (rule.min !== undefined && n < rule.min) return { error: `must be >= ${rule.min}` };
      if (rule.max !== undefined && n > rule.max) return { error: `must be <= ${rule.max}` };
      return { value: n };
    }
    case 'bool': {
      const v = raw.toLowerCase();
      if (TRUE.has(v)) return { value: true };
      if (FALSE.has(v)) return { value: false };
      return { error: 'must be a boolean (true/false/1/0/yes/no/on/off)' };
    }
    case 'enum':
      return rule.values.includes(raw) ? { value: raw } : { error: `must be one of: ${rule.values.join(', ')}` };
    case 'url':
      try {
        return { value: new URL(raw).href };
      } catch {
        return { error: 'must be a valid URL' };
      }
    default:
      return { error: `unknown type ${rule.type}` };
  }
}

export function readConfig(env, schema) {
  const config = {};
  const errors = [];
  for (const [key, rule] of Object.entries(schema)) {
    const raw = env[key];
    if (raw === undefined || String(raw).trim() === '') {
      if (rule.default !== undefined) config[key] = rule.default;
      else if (rule.required) errors.push({ key, message: 'is required' });
      continue;
    }
    const { value, error } = coerce(String(raw).trim(), rule);
    if (error) errors.push({ key, message: error });
    else config[key] = value;
  }
  if (errors.length > 0) throw new ConfigError(errors);
  return config;
}
