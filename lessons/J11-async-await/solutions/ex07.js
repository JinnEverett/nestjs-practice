// ex07 · processOrders — đáp án best practice
//
// Bug gốc: forEach không đợi callback async → hàm trả về ngay với mảng rỗng; lỗi xảy ra sau đó không ai thấy.
//
// - Promise.allSettled: chạy song song, đợi TẤT CẢ, không reject sớm khi một đơn lỗi.
// - Kết quả allSettled cùng thứ tự với orders → zip theo index để lấy id.
// - Tách 2 danh sách bằng filter/map → không có state mutate chia sẻ giữa các callback.
// Với hàng nghìn đơn: kết hợp giới hạn concurrency (ex04) để không làm quá tải cổng thanh toán.
export async function processOrders(orders, charge) {
  const outcomes = await Promise.allSettled(orders.map((order) => charge(order)));
  const withIds = outcomes.map((outcome, i) => ({ id: orders[i].id, outcome }));

  return {
    succeeded: withIds.filter(({ outcome }) => outcome.status === 'fulfilled').map(({ id }) => id),
    failed: withIds.filter(({ outcome }) => outcome.status === 'rejected').map(({ id, outcome }) => ({ id, reason: outcome.reason.message })),
  };
}
