// J05 · ex09 — code có bug. Viết lại đúng vào answers/ex09.js
const EMPTY_CART = { items: [] };

export function addItem(item, cart = EMPTY_CART) {
  const existing = cart.items.find((it) => it.productId === item.productId);
  if (existing) {
    existing.qty += item.qty;
  } else {
    cart.items.push(item);
  }
  return cart;
}
