import express from 'express';

export function createApp() {
  const app = express();

  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  app.post('/echo', express.json({ limit: '10kb' }), (req, res) => {
    if (req.body === undefined) return res.status(400).json({ error: 'Body required' });
    res.status(201).json(req.body);
  });

  app.get('/boom', () => {
    throw new Error('lỗi đồng bộ — chi tiết nội bộ');
  });
  app.get('/boom-async', async () => {
    await Promise.resolve();
    throw new Error('lỗi async — chi tiết nội bộ'); // Express 5 tự chuyển vào error handler
  });

  app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

  // eslint-disable-next-line no-unused-vars -- Express nhận dạng error handler theo 4 tham số
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Payload Too Large' });
    res.status(500).json({ error: 'Internal Server Error' });
  });
  return app;
}
