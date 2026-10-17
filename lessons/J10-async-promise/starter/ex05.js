// J10 · ex05 — callback hell có bug. Viết lại bằng Promise vào answers/ex05.js
export function getUserSummary(id, api, done) {
  api.getUser(id, (err, user) => {
    if (err) return done(err);
    api.getOrders(user.id, (err, orders) => {
      if (err) return done(err);
      let totalPaid = 0;
      let pending = orders.length;
      if (pending === 0) return done(null, { name: user.name, orderCount: 0, totalPaid: 0 });
      orders.forEach((order) => {
        api.getPayments(order.id, (err, payments) => {
          // BUG: lỗi bị bỏ qua, và nếu nhiều lần lỗi thì done có thể không bao giờ được gọi
          if (!err) {
            payments.filter((p) => p.status === 'succeeded').forEach((p) => (totalPaid += p.amount));
          }
          pending--;
          if (pending === 0) done(null, { name: user.name, orderCount: orders.length, totalPaid });
        });
      });
    });
  });
}
