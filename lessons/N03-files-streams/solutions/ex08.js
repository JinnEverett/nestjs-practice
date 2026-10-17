import { open } from 'node:fs/promises';

const BLOCK = 64 * 1024;

export async function tail(path, n) {
  if (n <= 0) return [];
  const fh = await open(path, 'r');
  try {
    const { size } = await fh.stat();
    let pos = size;
    let newlines = 0;
    const blocks = [];
    // Cần n+1 dấu xuống dòng để chắc chắn có đủ n dòng hoàn chỉnh (dòng đầu của vùng đọc có thể dang dở)
    while (pos > 0 && newlines <= n) {
      const len = Math.min(BLOCK, pos);
      pos -= len;
      const buf = Buffer.alloc(len);
      await fh.read(buf, 0, len, pos);
      blocks.unshift(buf);
      let i = -1;
      while ((i = buf.indexOf(0x0a, i + 1)) !== -1) newlines++;
    }
    // Chỉ decode SAU khi nối byte → không hỏng ký tự UTF-8 nằm ở biên khối
    const lines = Buffer.concat(blocks).toString('utf8').split('\n');
    if (lines.at(-1) === '') lines.pop();
    return lines.slice(-n).map((l) => (l.endsWith('\r') ? l.slice(0, -1) : l));
  } finally {
    await fh.close();
  }
}
