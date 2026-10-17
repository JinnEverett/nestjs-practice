import { once } from 'node:events';

export async function writeAll(writable, chunks) {
  const finished = once(writable, 'finish'); // reject nếu writable phát 'error'
  finished.catch(() => {}); // tránh unhandledRejection khi lỗi xảy ra giữa vòng lặp; lỗi vẫn được ném ở await bên dưới
  for (const chunk of chunks) {
    if (!writable.write(chunk)) await once(writable, 'drain');
  }
  writable.end();
  await finished;
}
