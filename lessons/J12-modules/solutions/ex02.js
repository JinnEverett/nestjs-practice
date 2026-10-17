// ex02 · slugify (ESM) — đáp án best practice
//
// - `export const` / `export function` ngay tại chỗ khai báo → nhìn là biết cái gì public.
// - default export cho "thứ chính" của module (createSlugger), named export cho phần phụ.
//   Nhiều team cấm default export (khó rename/tìm kiếm, auto-import kém) — NestJS chủ yếu dùng named export.
// - Escape separator trong RegExp bằng hàm riêng thay vì '\\' + separator (an toàn với mọi ký tự).
export const DEFAULT_SEPARATOR = '-';

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function slugify(text, separator = DEFAULT_SEPARATOR) {
  const sep = escapeRegExp(separator);
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, separator)
    .replace(new RegExp(`^(?:${sep})+|(?:${sep})+$`, 'g'), '');
}

export default function createSlugger(separator) {
  return (text) => slugify(text, separator);
}
