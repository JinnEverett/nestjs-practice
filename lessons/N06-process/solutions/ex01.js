const LINE_RE = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/;
const ESCAPES = { n: '\n', t: '\t', '"': '"', '\\': '\\' };

/** Đọc chuỗi trong "…" bắt đầu tại `start` (ngay sau dấu mở). Trả { value, end } với end là chỉ số sau dấu đóng, hoặc null nếu không đóng. */
function readDoubleQuoted(text, start) {
  let value = '';
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === '\\' && i + 1 < text.length) {
      const next = text[i + 1];
      value += ESCAPES[next] ?? `\\${next}`;
      i++;
    } else if (ch === '"') {
      return { value, end: i + 1 };
    } else {
      value += ch;
    }
  }
  return null;
}

export function loadEnv(source) {
  const text = source.replace(/\r\n/g, '\n');
  const out = {};
  let i = 0;
  while (i < text.length) {
    let eol = text.indexOf('\n', i);
    if (eol === -1) eol = text.length;
    const line = text.slice(i, eol);
    const m = LINE_RE.exec(line);
    if (line.trim() === '' || line.trim().startsWith('#') || !m) {
      i = eol + 1;
      continue;
    }
    const key = m[1];
    const rest = m[2].trimStart();
    const restStart = i + line.length - rest.length;

    if (rest.startsWith('"')) {
      const closed = readDoubleQuoted(text, restStart + 1);
      if (closed) {
        out[key] = closed.value;
        const nl = text.indexOf('\n', closed.end);
        i = nl === -1 ? text.length : nl + 1;
      } else {
        out[key] = rest.slice(1); // không có dấu đóng: lấy phần còn lại của dòng
        i = eol + 1;
      }
      continue;
    }
    if (rest.startsWith("'")) {
      const close = rest.indexOf("'", 1);
      out[key] = close === -1 ? rest.slice(1) : rest.slice(1, close);
      i = eol + 1;
      continue;
    }
    out[key] = rest.replace(/\s+#.*$/, '').trim();
    i = eol + 1;
  }
  return out;
}
