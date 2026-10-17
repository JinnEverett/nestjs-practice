import http from 'node:http';

export function startServer(app, { port = 0, shutdownTimeoutMs = 5000 } = {}) {
  return new Promise((resolve, reject) => {
    const active = new Set();
    let closing = false;
    let closePromise;

    const server = http.createServer((req, res) => {
      active.add(res);
      const done = () => active.delete(res);
      res.once('finish', done);
      res.once('close', done);
      if (closing) res.setHeader('Connection', 'close');
      app(req, res);
    });

    function close() {
      closePromise ??= new Promise((resolveClose) => {
        closing = true;
        // request đang chạy: gửi xong thì báo client đóng kết nối
        for (const res of active) if (!res.headersSent) res.setHeader('Connection', 'close');
        let forced = false;
        const timer = setTimeout(() => {
          forced = true;
          server.closeAllConnections();
        }, shutdownTimeoutMs);
        server.close(() => {
          clearTimeout(timer);
          resolveClose({ forced });
        });
        server.closeIdleConnections(); // kết nối keep-alive đang rảnh
      });
      return closePromise;
    }

    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve({ server, port: server.address().port, close }));
  });
}
