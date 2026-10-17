// Helper cho bài 🔮 "đoán output": chạy starter/exNN.js thật, so từng dòng với answers/exNN.txt.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const norm = (s) => s.trim().replace(/\s+/g, ' ').replace(/^\d+[.)]\s+/, '');

/** predictTest(import.meta.url, 'ex01') — gọi từ checks/ex01.test.js */
export function predictTest(metaUrl, ex) {
  const js = fileURLToPath(new URL(`../starter/${ex}.js`, metaUrl));
  const script = existsSync(js) ? js : fileURLToPath(new URL(`../starter/${ex}.cjs`, metaUrl));
  const actual = execFileSync(process.execPath, [script], { encoding: 'utf8', timeout: 10_000 })
    .split(/\r?\n/)
    .map(norm)
    .filter(Boolean);
  const predicted = readFileSync(new URL(`../answers/${ex}.txt`, metaUrl), 'utf8')
    .split(/\r?\n/)
    .map(norm)
    .filter(Boolean);

  test(`${ex} · số dòng output (${actual.length})`, () => assert.equal(predicted.length, actual.length));
  actual.forEach((line, i) => {
    test(`${ex} · dòng ${i + 1}`, () => assert.equal(predicted[i] ?? '(thiếu)', line));
  });
}
