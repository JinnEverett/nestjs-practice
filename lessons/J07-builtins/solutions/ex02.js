// ex02 · slugify — đáp án best practice
//
// - normalize('NFD') tách chữ có dấu thành chữ gốc + dấu kết hợp; \p{Diacritic} (cờ u) xóa dấu.
// - 'đ' không tách được bằng NFD → thay tay.
// - Một regex `[^a-z0-9]+` gom mọi chuỗi ký tự lạ liên tiếp thành MỘT '-'.
// - Cắt '-' ở 2 đầu bằng regex neo ^ và $.
export function slugify(title) {
  return title
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
