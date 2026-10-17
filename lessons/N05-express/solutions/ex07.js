const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);

const checkers = {
  string: (v, r) => {
    if (typeof v !== 'string') return 'must be a string';
    if (r.min !== undefined && v.length < r.min) return `length must be >= ${r.min}`;
    if (r.max !== undefined && v.length > r.max) return `length must be <= ${r.max}`;
  },
  int: (v, r) => {
    if (typeof v !== 'number' || !Number.isInteger(v)) return 'must be an integer';
    if (r.min !== undefined && v < r.min) return `must be >= ${r.min}`;
    if (r.max !== undefined && v > r.max) return `must be <= ${r.max}`;
  },
  number: (v, r) => {
    if (typeof v !== 'number' || !Number.isFinite(v)) return 'must be a finite number';
    if (r.min !== undefined && v < r.min) return `must be >= ${r.min}`;
    if (r.max !== undefined && v > r.max) return `must be <= ${r.max}`;
  },
  boolean: (v) => (typeof v === 'boolean' ? undefined : 'must be a boolean'),
};

function validateObject(source, rules, prefix, details) {
  const clean = {};
  if (!isObject(source)) {
    details.push({ path: prefix, message: 'must be an object' });
    return clean;
  }
  for (const [field, rule] of Object.entries(rules)) {
    const value = Object.hasOwn(source, field) ? source[field] : undefined;
    if (value === undefined) {
      if (!rule.optional) details.push({ path: `${prefix}.${field}`, message: 'is required' });
      continue;
    }
    const message = checkers[rule.type](value, rule);
    if (message) details.push({ path: `${prefix}.${field}`, message });
    else clean[field] = value;
  }
  return clean;
}

export function validate(schema) {
  return (req, res, next) => {
    const details = [];
    let body = req.body;
    if (schema.body) body = validateObject(req.body, schema.body, 'body', details);
    if (schema.query) validateObject(req.query, schema.query, 'query', details);
    if (details.length > 0) return res.status(400).json({ error: 'Validation failed', details });
    if (schema.body) req.body = body; // chỉ field trong schema
    next();
  };
}
