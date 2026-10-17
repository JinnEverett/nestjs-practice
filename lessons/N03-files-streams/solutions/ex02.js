export function encodeFrame(text) {
  const body = Buffer.from(text, 'utf8');
  const head = Buffer.alloc(4);
  head.writeUInt32BE(body.length, 0);
  return Buffer.concat([head, body]);
}

export function decodeFrames(buf) {
  const messages = [];
  let offset = 0;
  while (buf.length - offset >= 4) {
    const len = buf.readUInt32BE(offset);
    if (buf.length - offset - 4 < len) break; // khung dang dở
    messages.push(buf.subarray(offset + 4, offset + 4 + len).toString('utf8'));
    offset += 4 + len;
  }
  return { messages, rest: buf.subarray(offset) };
}
