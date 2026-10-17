// J11 · ex07 — code có bug. Viết lại đúng vào answers/ex07.js
export async function processOrders(orders, charge) {
  const succeeded = [];
  const failed = [];
  orders.forEach(async (order) => {
    try {
      await charge(order);
      succeeded.push(order.id);
    } catch (e) {
      failed.push({ id: order.id, reason: e.message });
    }
  });
  return { succeeded, failed }; // trả về NGAY, khi chưa đơn nào xong
}
