// Server http thuần dùng ở S00 để thử bench.
//   GET /fast        → trả JSON ngay
//   GET /block       → chặn event loop 20ms bằng vòng lặp đồng bộ rồi mới trả
//   GET /_debug/loop → p99 event loop delay (ms) kể từ lần gọi trước
// Chạy: node bench/hello-server.js   (cổng 3000)
import http from 'node:http';
import { monitorEventLoopDelay } from 'node:perf_hooks';

const h = monitorEventLoopDelay({ resolution: 10 });
h.enable();

const busy = (ms) => {
  const end = Date.now() + ms;
  while (Date.now() < end) {}
};

http
  .createServer((req, res) => {
    if (req.url === '/_debug/loop') {
      const body = JSON.stringify({ p99Ms: h.percentile(99) / 1e6 });
      h.reset();
      return res.writeHead(200, { 'content-type': 'application/json' }).end(body);
    }
    if (req.url === '/block') busy(20);
    res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ ok: true, path: req.url }));
  })
  .listen(Number(process.env.PORT ?? 3000), () => console.log(`hello-server: http://localhost:${process.env.PORT ?? 3000}`));
