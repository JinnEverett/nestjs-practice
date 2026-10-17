export function applyCors(req, res, options) {
  const {
    origins,
    methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    headers = ['Content-Type', 'Authorization'],
    maxAge = 600,
  } = options;

  const origin = req.headers.origin;
  if (!origin) return false;

  const wildcard = origins.includes('*');
  if (wildcard) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (origins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin'); // cache phải phân biệt theo Origin
  }

  const isPreflight = req.method === 'OPTIONS' && Boolean(req.headers['access-control-request-method']);
  if (!isPreflight) return false;

  res.setHeader('Access-Control-Allow-Methods', methods.join(', '));
  res.setHeader('Access-Control-Allow-Headers', headers.join(', '));
  res.setHeader('Access-Control-Max-Age', String(maxAge));
  res.writeHead(204);
  res.end();
  return true;
}
