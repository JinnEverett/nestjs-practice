import express from 'express';
import http from 'node:http';

const log = [];
const app = express();

app.use((req, res, next) => {
  log.push('A trước');
  next();
  log.push('A sau');
});
app.use('/api', (req, res, next) => {
  log.push('B /api');
  next();
});

const router = express.Router();
router.use((req, res, next) => {
  log.push('C router.use');
  next();
});
router.get(
  '/items',
  (req, res, next) => {
    log.push('D items #1');
    next('route');
  },
  (req, res) => {
    log.push('E items #1b');
    res.send('x');
  },
);
router.get('/items', (req, res, next) => {
  log.push('F items #2');
  next(new Error('boom'));
});
router.get('/items', (req, res) => {
  log.push('G items #3');
  res.send('x');
});
app.use('/api', router);

app.use((req, res) => {
  log.push('H 404');
  res.status(404).send('nf');
});
app.use((err, req, res, next) => {
  log.push(`I lỗi: ${err.message}`);
  res.status(500).send('err');
});

const server = http.createServer(app).listen(0, async () => {
  const { port } = server.address();
  const r = await fetch(`http://127.0.0.1:${port}/api/items`);
  await r.text();
  log.push(`J status ${r.status}`);
  server.close();
  for (const line of log) console.log(line);
});
