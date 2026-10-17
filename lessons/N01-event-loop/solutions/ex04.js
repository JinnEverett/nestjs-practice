const yieldToLoop = () => new Promise((resolve) => setImmediate(resolve));

export async function mapInChunks(items, fn, { budgetMs = 8 } = {}) {
  const out = new Array(items.length);
  let sliceStart = performance.now();
  for (let i = 0; i < items.length; i++) {
    out[i] = fn(items[i], i); // ném lỗi → async function reject ngay
    if (performance.now() - sliceStart >= budgetMs) {
      await yieldToLoop();
      sliceStart = performance.now();
    }
  }
  return out;
}
