// ex01 · keyof / typeof / indexed access — đáp án best practice
//
// - Giá trị `as const` là nguồn sự thật; RouteName, RoutePath DẪN XUẤT từ nó → thêm route không phải sửa kiểu.
// - `(typeof ROUTES)[RouteName]` = union mọi giá trị.
// - `Order['items'][number]`: kiểu phần tử, không cần khai báo interface OrderItem riêng.
export const ROUTES = { home: '/', orders: '/orders', orderDetail: '/orders/:id' } as const;

export type RouteName = keyof typeof ROUTES;
export type RoutePath = (typeof ROUTES)[RouteName];

export function routePath(name: RouteName): RoutePath {
  return ROUTES[name];
}

export interface Order {
  id: number;
  items: { productId: number; qty: number }[];
}
export type OrderItem = Order['items'][number];
