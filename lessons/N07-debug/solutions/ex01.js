// Lỗi gốc: forEach(async …) KHÔNG chờ các callback → hàm trả 0 trước khi email đi;
// reject bên trong callback không ai bắt → unhandledRejection.
export async function confirmOrders(orders, mailer, { concurrency = 3 } = {}) {
  let sent = 0;
  const failed = [];
  let next = 0;

  async function worker() {
    while (next < orders.length) {
      const index = next++;
      const order = orders[index];
      try {
        await mailer.send(order.email, `Đơn #${order.id} đã được xác nhận`);
        sent++;
      } catch (error) {
        failed.push({ index, id: order.id, error });
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, orders.length) }, worker);
  await Promise.all(workers); // worker không bao giờ reject vì đã try/catch từng email
  failed.sort((a, b) => a.index - b.index);
  return { sent, failed: failed.map(({ id, error }) => ({ id, error })) };
}
