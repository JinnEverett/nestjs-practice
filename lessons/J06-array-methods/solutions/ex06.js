// ex06 · sortBy — đáp án best practice
//
// - Một comparator duy nhất duyệt lần lượt các tiêu chí, trả kết quả khác 0 đầu tiên.
// - Xử lý null TRƯỚC khi áp dụng chiều sort → null luôn ở cuối dù asc hay desc
//   (giống `NULLS LAST` bên SQL).
// - Tách hàm compareValues: chuỗi dùng Intl.Collator (tạo một lần, nhanh hơn localeCompare lặp lại),
//   còn lại dùng phép trừ / so sánh.
// - toSorted → stable + không mutate.
const collator = new Intl.Collator('vi');

const compareValues = (a, b) => (typeof a === 'string' && typeof b === 'string' ? collator.compare(a, b) : a < b ? -1 : a > b ? 1 : 0);

export function sortBy(items, criteria) {
  return items.toSorted((x, y) => {
    for (const { key, dir = 'asc' } of criteria) {
      const a = x[key];
      const b = y[key];
      if (a == null || b == null) {
        if (a == null && b == null) continue;
        return a == null ? 1 : -1;
      }
      const cmp = compareValues(a, b);
      if (cmp !== 0) return dir === 'desc' ? -cmp : cmp;
    }
    return 0;
  });
}
