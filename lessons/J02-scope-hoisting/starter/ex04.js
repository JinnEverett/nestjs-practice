// J02 · ex04 — code có bug. Viết lại đúng vào answers/ex04.js
export function calculateTotal(items) {
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    total = total + item.price * item.qty;
  }
  if (total >= 1000000) {
    var discount = 0.1;
  }
  return total - total * discount;
}
