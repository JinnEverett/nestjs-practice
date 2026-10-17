// 🐞 Bán vượt tồn kho khi nhiều request đồng thời. Copy sang answers/ex03.js rồi sửa.
// db: { async get(sku) -> { stock }, async set(sku, { stock }) }
export function createInventory(db) {
  return {
    async reserve(sku, qty) {
      const row = await db.get(sku);
      if (row.stock < qty) return false;
      await db.set(sku, { stock: row.stock - qty });
      return true;
    },
  };
}
