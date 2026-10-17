const VERSION_RE = /^(\d+)\.(\d+)\.(\d+)$/;
const PARTIAL_RE = /^(?:v|=)?(\*|x|X|\d+)(?:\.(\*|x|X|\d+))?(?:\.(\*|x|X|\d+))?$/;
const isWild = (p) => p === undefined || p === '*' || p === 'x' || p === 'X';

const parseVersion = (v) => {
  const m = VERSION_RE.exec(String(v).trim());
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
};
const cmp = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

/** "1.2" / "1.x" / "1" → { major, minor, patch } với phần thiếu/wildcard là null */
function parsePartial(text) {
  const m = PARTIAL_RE.exec(text);
  if (!m) throw new TypeError(`Invalid range: ${text}`);
  const part = (p) => (isWild(p) ? null : Number(p));
  return { major: part(m[1]), minor: part(m[2]), patch: part(m[3]) };
}

/** Đổi 1 comparator thành danh sách điều kiện [op, [x,y,z]] (AND) */
function expand(token) {
  const m = /^(\^|~|>=|<=|>|<|=)?\s*(.+)$/.exec(token);
  if (!m) throw new TypeError(`Invalid range: ${token}`);
  const op = m[1] ?? '';
  const { major, minor, patch } = parsePartial(m[2]);
  if (major === null) return []; // * → mọi bản
  const lo = [major, minor ?? 0, patch ?? 0];

  if (op === '^') {
    let hi;
    if (major > 0 || minor === null) hi = [major + 1, 0, 0];
    else if (minor > 0 || patch === null) hi = [0, minor + 1, 0];
    else hi = [0, 0, patch + 1];
    return [['>=', lo], ['<', hi]];
  }
  if (op === '~') {
    const hi = minor === null ? [major + 1, 0, 0] : [major, minor + 1, 0];
    return [['>=', lo], ['<', hi]];
  }
  if (op === '' || op === '=') {
    if (minor === null) return [['>=', lo], ['<', [major + 1, 0, 0]]];
    if (patch === null) return [['>=', lo], ['<', [major, minor + 1, 0]]];
    return [['>=', lo], ['<=', lo]];
  }
  // so sánh trên partial: >1.2 nghĩa là >=1.3.0 ; <=1.2 nghĩa là <1.3.0
  if (op === '>') {
    if (minor === null) return [['>=', [major + 1, 0, 0]]];
    if (patch === null) return [['>=', [major, minor + 1, 0]]];
    return [['>', lo]];
  }
  if (op === '<=') {
    if (minor === null) return [['<', [major + 1, 0, 0]]];
    if (patch === null) return [['<', [major, minor + 1, 0]]];
    return [['<=', lo]];
  }
  return [[op, lo]]; // >= và <
}

const holds = (v, [op, bound]) => {
  const c = cmp(v, bound);
  return op === '>=' ? c >= 0 : op === '>' ? c > 0 : op === '<=' ? c <= 0 : op === '<' ? c < 0 : c === 0;
};

export function satisfies(version, range) {
  const sets = String(range).split('||').map((set) => {
    const tokens = set.trim().split(/\s+/).filter(Boolean);
    return tokens.flatMap(expand); // ném TypeError nếu token sai → báo lỗi range kể cả khi version sai
  });
  const v = parseVersion(version);
  if (!v) return false;
  return sets.some((conds) => conds.every((c) => holds(v, c)));
}
