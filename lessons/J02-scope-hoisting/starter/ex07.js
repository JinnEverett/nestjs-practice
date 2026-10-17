// J02 · ex07 — handler có bug rò dữ liệu giữa các request.
let currentUser = null;

export async function handleRequest(user, loadOrders) {
  currentUser = user;
  const orders = await loadOrders(user.id); // trong lúc chờ DB, request khác có thể chạy
  return { user: currentUser.name, orders: orders.length };
}
