const BODY_PARSER_MESSAGES = {
  'entity.parse.failed': 'Invalid JSON',
  'entity.too.large': 'Payload Too Large',
};

export function notFound() {
  return (req, res) => res.status(404).json({ error: 'Not Found' });
}

export function errorHandler({ onError } = {}) {
  // eslint-disable-next-line no-unused-vars
  return (err, req, res, next) => {
    if (res.headersSent) return next(err); // để Express đóng kết nối
    if (req.id) res.setHeader('X-Request-Id', req.id);

    const status = Number(err.status ?? err.statusCode);
    const fromBodyParser = status >= 400 && status < 500 && typeof err.type === 'string' && err.type.startsWith('entity.');
    if (err.expose === true || fromBodyParser) {
      const message = BODY_PARSER_MESSAGES[err.type] ?? err.message;
      return res.status(status >= 400 && status < 600 ? status : 400).json({ error: message });
    }
    onError?.(err, req);
    res.status(500).json({ error: 'Internal Server Error' });
  };
}
