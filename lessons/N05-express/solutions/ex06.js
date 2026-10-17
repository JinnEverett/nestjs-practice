import { createHash, timingSafeEqual } from 'node:crypto';

const sha256 = (s) => createHash('sha256').update(String(s)).digest();

export function requireApiKey(keys) {
  // Băm khóa một lần: so sánh luôn trên 32 byte, không tra object bằng input của người dùng
  const table = Object.entries(keys).map(([key, user]) => ({ digest: sha256(key), user }));
  return (req, res, next) => {
    const provided = req.get('x-api-key');
    if (typeof provided === 'string' && provided !== '') {
      const digest = sha256(provided);
      let found = null;
      for (const entry of table) {
        if (timingSafeEqual(digest, entry.digest)) found = entry.user; // duyệt hết, không break sớm
      }
      if (found) {
        res.locals.user = { name: found.name, roles: [...found.roles] };
        return next();
      }
    }
    res.set('WWW-Authenticate', 'ApiKey').status(401).json({ error: 'Unauthorized' });
  };
}

export function requireRole(role) {
  return (req, res, next) => {
    if (res.locals.user?.roles?.includes(role)) return next();
    res.status(403).json({ error: 'Forbidden' });
  };
}
