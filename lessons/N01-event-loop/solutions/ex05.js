import { pbkdf2 } from 'node:crypto';
import { promisify } from 'node:util';

const pbkdf2Async = promisify(pbkdf2);

export async function benchPbkdf2(counts) {
  const results = [];
  for (const n of counts) {
    const start = performance.now();
    await Promise.all(
      Array.from({ length: n }, () => pbkdf2Async('password', 'salt-cố-định', 100_000, 64, 'sha512')),
    );
    results.push({ n, ms: performance.now() - start });
  }
  return results;
}
