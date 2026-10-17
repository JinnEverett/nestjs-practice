import { readFile } from 'node:fs';

readFile(import.meta.filename, () => {
  console.log('A đang ở callback I/O');
  setTimeout(() => console.log('B timeout 0'), 0);
  setImmediate(() => console.log('C immediate'));
  process.nextTick(() => console.log('D nextTick'));
  Promise.resolve().then(() => console.log('E promise'));
  console.log('F cuối callback');
});
