// ex10 · applyQuery — đáp án best practice
//
// - Chuẩn hóa tìm kiếm: NFD tách dấu → xóa ký tự dấu (\p{Diacritic}) → đ/Đ đổi tay (không tách được)
//   → lowercase. Áp cho cả q lẫn name.
// - Mỗi bộ lọc là một điều kiện độc lập, chỉ áp khi tham số có mặt → dễ thêm bộ lọc mới.
// - Bảng SORTERS ánh xạ tên sort → comparator (allow-list): input lạ rơi về mặc định, không thể
//   sort theo field tùy ý (an toàn khi nhận từ query string — R01).
// - total tính SAU khi lọc, TRƯỚC khi cắt trang.
// Production: làm việc này trong SQL (WHERE/ORDER BY/LIMIT + index) chứ không kéo hết bảng về app.
const normalize = (s) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();

const collator = new Intl.Collator('vi');
const byId = (a, b) => a.id - b.id;
const SORTERS = {
  price: (a, b) => a.price - b.price || byId(a, b),
  '-price': (a, b) => b.price - a.price || byId(a, b),
  name: (a, b) => collator.compare(a.name, b.name) || byId(a, b),
  '-name': (a, b) => collator.compare(b.name, a.name) || byId(a, b),
};

export function applyQuery(products, { q, minPrice, maxPrice, categoryIds, sort, page = 1, limit = 20 } = {}) {
  const needle = q?.trim() ? normalize(q.trim()) : null;
  const categories = categoryIds?.length ? new Set(categoryIds) : null;

  const filtered = products.filter(
    (p) =>
      p.isActive === true &&
      (needle === null || normalize(p.name).includes(needle)) &&
      (minPrice === undefined || p.price >= minPrice) &&
      (maxPrice === undefined || p.price <= maxPrice) &&
      (categories === null || categories.has(p.categoryId)),
  );

  const sorted = filtered.toSorted(SORTERS[sort] ?? byId);
  const start = (page - 1) * limit;

  return {
    data: sorted.slice(start, start + limit),
    total: filtered.length,
    page,
    limit,
    totalPages: Math.ceil(filtered.length / limit),
  };
}
