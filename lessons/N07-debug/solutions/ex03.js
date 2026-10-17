// Lỗi gốc: get → kiểm tra → set có `await` ở giữa, nên nhiều request cùng đọc stock cũ rồi cùng ghi.
// Sửa: tuần tự hóa các lời gọi trên CÙNG sku bằng hàng đợi theo key (mutex nhẹ).
export function createInventory(db) {
  const tails = new Map(); // sku → promise của lời gọi cuối đang xếp hàng

  function withLock(sku, task) {
    const previous = tails.get(sku) ?? Promise.resolve();
    const run = previous.then(task, task); // chạy sau cái trước, dù cái trước thành công hay lỗi
    const tail = run.catch(() => {}); // chuỗi khóa không bao giờ reject
    tails.set(sku, tail);
    tail.then(() => {
      if (tails.get(sku) === tail) tails.delete(sku); // dọn khi không còn ai chờ
    });
    return run;
  }

  return {
    reserve(sku, qty) {
      if (!Number.isInteger(qty) || qty <= 0) {
        return Promise.reject(new RangeError('qty must be a positive integer'));
      }
      return withLock(sku, async () => {
        const row = await db.get(sku);
        if (row.stock < qty) return false;
        await db.set(sku, { stock: row.stock - qty });
        return true;
      });
    },
  };
}
