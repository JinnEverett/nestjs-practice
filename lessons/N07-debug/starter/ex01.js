// 🐞 Có lỗi trong file này. Copy sang answers/ex01.js rồi sửa.
// Gửi email xác nhận cho từng đơn; trả về số email gửi thành công.
export async function confirmOrders(orders, mailer) {
  let sent = 0;
  orders.forEach(async (order) => {
    await mailer.send(order.email, `Đơn #${order.id} đã được xác nhận`);
    sent++;
  });
  return sent;
}
