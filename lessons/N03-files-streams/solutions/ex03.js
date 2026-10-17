import { createReadStream } from 'node:fs';

export async function countLines(path) {
  let newlines = 0;
  let size = 0;
  let lastByte = -1;
  for await (const chunk of createReadStream(path)) {
    size += chunk.length;
    let i = -1;
    while ((i = chunk.indexOf(0x0a, i + 1)) !== -1) newlines++;
    lastByte = chunk[chunk.length - 1];
  }
  if (size === 0) return 0;
  return lastByte === 0x0a ? newlines : newlines + 1;
}
