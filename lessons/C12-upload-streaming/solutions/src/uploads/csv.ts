/**
 * Một ô CSV theo RFC 4180, có chống "CSV injection": Excel/Sheets coi ô bắt đầu bằng = + - @ (hoặc tab/CR)
 * là CÔNG THỨC. Chuỗi như `=HYPERLINK(...)` do người dùng nhập sẽ thành lệnh khi nhân viên mở file.
 */
export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  let text = typeof value === 'string' ? value : String(value);
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]|^\s|\s$/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export const csvLine = (values: readonly unknown[]): string => values.map(csvCell).join(',') + '\r\n';
