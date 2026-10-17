import { Worker } from 'node:worker_threads';

const WORKER_CODE = `
  const { parentPort, workerData } = require('node:worker_threads');
  const fib = (n) => (n < 2 ? n : fib(n - 1) + fib(n - 2));
  parentPort.postMessage(fib(workerData));
`;

export function fibInWorker(n) {
  if (!Number.isInteger(n) || n < 0 || n > 50) {
    return Promise.reject(new RangeError('n must be an integer in 0..50'));
  }
  return new Promise((resolve, reject) => {
    const worker = new Worker(WORKER_CODE, { eval: true, workerData: n });
    worker.once('message', (result) => {
      resolve(result);
      worker.terminate();
    });
    worker.once('error', reject);
    worker.once('exit', (code) => {
      if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
    });
  });
}
