// ex08 · createBatcher — đáp án best practice (ý tưởng của thư viện `dataloader`)
//
// - Batch hiện tại = Map<key, deferred[]> → key trùng gộp lại, mỗi caller vẫn có promise riêng để settle.
// - Lên lịch flush bằng setTimeout(maxWaitMs) cho key ĐẦU TIÊN của batch; đủ maxBatchSize thì flush ngay.
// - Khi flush: "chụp" batch hiện tại rồi tạo batch mới NGAY (load đến sau vào batch sau) → không lẫn.
// - Kết quả được phát theo index; phần tử là Error → reject riêng caller đó; sai độ dài / batchFn lỗi → reject cả batch.
// Trong NestJS + GraphQL (M05): một DataLoader per request để tránh N+1 khi resolve field lồng nhau.
export function createBatcher(batchFn, { maxBatchSize = 100, maxWaitMs = 0 } = {}) {
  let batch = null;

  const flush = async (current) => {
    clearTimeout(current.timer);
    if (batch === current) batch = null;
    const keys = [...current.waiters.keys()];
    try {
      const values = await batchFn(keys);
      if (!Array.isArray(values) || values.length !== keys.length) {
        throw new Error(`batchFn must return ${keys.length} results, got ${values?.length}`);
      }
      keys.forEach((key, i) => {
        const value = values[i];
        for (const { resolve, reject } of current.waiters.get(key)) {
          if (value instanceof Error) reject(value);
          else resolve(value);
        }
      });
    } catch (error) {
      for (const list of current.waiters.values()) for (const { reject } of list) reject(error);
    }
  };

  return {
    load(key) {
      return new Promise((resolve, reject) => {
        if (!batch) {
          const current = { waiters: new Map(), timer: undefined };
          current.timer = setTimeout(() => flush(current), maxWaitMs);
          batch = current;
        }
        const current = batch;
        if (!current.waiters.has(key)) current.waiters.set(key, []);
        current.waiters.get(key).push({ resolve, reject });
        if (current.waiters.size >= maxBatchSize) flush(current);
      });
    },
  };
}
