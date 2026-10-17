// ex03 · parseCsvLine (CommonJS) — đáp án best practice
//
// - Máy trạng thái 1 lượt duyệt: đang trong ngoặc kép hay không. O(n), không regex phức tạp.
// - `""` trong ngoặc kép → một dấu ".
// - module.exports = { ... } ở cuối file: một chỗ duy nhất thấy API public của module.
// Thực tế: CSV có xuống dòng trong field, BOM, encoding… → dùng thư viện (csv-parse) + stream (N03).
'use strict';

function parseCsvLine(line, separator = ',') {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === separator) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

module.exports = { parseCsvLine };
