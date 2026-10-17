// ex03 · parseVnDate — đáp án best practice
//
// - Regex neo ^...$ với 3 nhóm bắt → kiểm định dạng và tách số trong một bước.
// - Dựng chuỗi ISO có offset TƯỜNG MINH '+07:00' → kết quả không phụ thuộc TZ của máy.
// - Kiểm "ngày có tồn tại không" bằng cách so lại thành phần sau khi tạo Date (Date tự tràn:
//   31/02 → 03/03). Dùng getUTC* trên Date.UTC(y, m-1, d) để không dính TZ máy.
const VN_DATE = /^(\d{2})\/(\d{2})\/(\d{4})$/;

export function parseVnDate(text) {
  const match = VN_DATE.exec(text);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);

  const probe = new Date(Date.UTC(year, month - 1, day));
  if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) return null;

  return new Date(`${yyyy}-${mm}-${dd}T00:00:00+07:00`);
}
