// ex05 · getUserSummary — đáp án best practice
//
// - promisify các hàm callback MỘT lần (bind để giữ this của api).
// - Chuỗi then phẳng: mỗi bước return promise của bước sau → lỗi ở bất kỳ đâu rơi xuống reject
//   của Promise trả về (không cần kiểm `if (err)` ở mỗi tầng).
// - Promise.all chạy getPayments cho mọi đơn SONG SONG và reject ngay khi một cái lỗi.
// - Tính tổng bằng flat + filter + reduce sau khi có đủ dữ liệu.
// Bản async/await (J11) đọc còn dễ hơn — xem cuối file.
import { promisify } from 'node:util';

export function getUserSummary(id, api) {
  const getUser = promisify(api.getUser.bind(api));
  const getOrders = promisify(api.getOrders.bind(api));
  const getPayments = promisify(api.getPayments.bind(api));

  return getUser(id).then((user) =>
    getOrders(user.id)
      .then((orders) => Promise.all(orders.map((order) => getPayments(order.id))).then((paymentLists) => ({ orders, paymentLists })))
      .then(({ orders, paymentLists }) => ({
        name: user.name,
        orderCount: orders.length,
        totalPaid: paymentLists
          .flat()
          .filter((p) => p.status === 'succeeded')
          .reduce((sum, p) => sum + p.amount, 0),
      })),
  );
}

// Cùng logic với async/await (J11):
// export async function getUserSummary(id, api) {
//   const user = await getUser(id);
//   const orders = await getOrders(user.id);
//   const paymentLists = await Promise.all(orders.map((o) => getPayments(o.id)));
//   ...
// }
