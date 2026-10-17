// Helper dựng server thật cho test Tier N (cổng ngẫu nhiên, đóng gọn).
import http from 'node:http';

/** Nhận handler (req, res) hoặc một http.Server đã tạo. Trả { url, server, close }. */
export async function serve(handlerOrServer) {
  const server = typeof handlerOrServer === 'function' ? http.createServer(handlerOrServer) : handlerOrServer;
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return {
    server,
    url: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise((resolve) => {
        server.closeAllConnections?.();
        server.close(() => resolve());
      }),
  };
}

/** Gọi fetch rồi trả { status, headers, text, json } tiện assert. */
export async function call(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = undefined; }
  return { status: res.status, headers: res.headers, text, json };
}
