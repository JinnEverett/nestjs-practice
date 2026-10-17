import { readFile } from 'node:fs/promises';

export async function readJson(path, ...fallback) {
  let text;
  try {
    text = await readFile(path, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT' && fallback.length > 0) return fallback[0];
    throw err;
  }
  try {
    return JSON.parse(text.replace(/^﻿/, ''));
  } catch (cause) {
    throw new Error(`Invalid JSON in ${path}`, { cause });
  }
}
