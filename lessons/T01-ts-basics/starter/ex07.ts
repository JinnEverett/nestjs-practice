// T01 · ex07 — viết kiểu JS, bật strict là lỗi. Viết lại vào answers/ex07.ts
// @ts-nocheck
export function effectivePrice(p) {
  return p.salePrice || p.price; // bug: salePrice = 0 (miễn phí) bị bỏ qua
}

export function findCheapest(products) {
  let best = products[0];
  for (const p of products) {
    if (effectivePrice(p) < effectivePrice(best)) best = p; // products rỗng → best undefined → TypeError
  }
  return best;
}

export function averagePrice(products) {
  const total = products.reduce((s, p) => s + effectivePrice(p), 0);
  return Math.round(total / products.length); // rỗng → NaN
}
