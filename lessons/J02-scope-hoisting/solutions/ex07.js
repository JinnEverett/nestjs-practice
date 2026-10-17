// ex07 · handleRequest — đáp án best practice
//
// Vì sao bug: `currentUser` là biến module scope — MỘT biến dùng chung cho mọi request.
// Request A gán currentUser = A rồi `await` (nhường event loop); request B chạy, gán currentUser = B;
// khi A chạy tiếp, nó đọc currentUser → B. Đây chính là bug "lưu state của request vào field của
// singleton service" trong NestJS.
//
// Cách chuẩn: dữ liệu của một request chỉ sống trong biến cục bộ / tham số của lời gọi đó.
// Module scope chỉ nên chứa hằng số, cấu hình bất biến, hoặc tài nguyên dùng chung CÓ CHỦ ĐÍCH (pool, cache có giới hạn).
export async function handleRequest(user, loadOrders) {
  const orders = await loadOrders(user.id);
  return { user: user.name, orders: orders.length };
}
