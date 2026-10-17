import { HttpError } from './ex01.js';

const tooLarge = () => new HttpError(413, 'Payload Too Large');

export async function readBody(req, { limit = 1024 * 1024 } = {}) {
  const declared = Number(req.headers['content-length']);
  if (Number.isFinite(declared) && declared > limit) throw tooLarge();

  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw tooLarge(); // dừng ngay khi vượt, không đọc tiếp
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export async function parseJsonBody(req, opts) {
  const text = await readBody(req, opts);
  if (text === '') return undefined;
  const type = String(req.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase();
  if (type !== 'application/json') throw new HttpError(415, 'Unsupported Media Type');
  try {
    return JSON.parse(text);
  } catch (cause) {
    throw new HttpError(400, 'Invalid JSON', { cause });
  }
}
