// Helper đọc mã nguồn cho check dạng "cấu trúc". Thêm bởi B01.

/**
 * Bỏ chú thích khối và chú thích dòng khỏi mã TypeScript để regex không khớp nhầm vào lời giải thích.
 * Đủ dùng cho check; không phải bộ phân tích cú pháp (chuỗi chứa `//` như URL được giữ lại vì chỉ bỏ `//` đứng đầu dòng hoặc sau khoảng trắng).
 */
export function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');
}
