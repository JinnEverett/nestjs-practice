// J13 · ex01 — ĐỌC, ĐỪNG CHẠY. Đoán output rồi ghi vào answers/ex01.txt
const show = (label, fn) => {
  try {
    console.log(label, fn());
  } catch (e) {
    console.log(label, e.name);
  }
};

const m = new Map([
  [1, 'số'],
  ['1', 'chuỗi'],
]);
console.log('A', m.get(1), m.get('1'), m.size);
const objKey = { id: 1 };
m.set(objKey, 'object');
console.log('B', m.get({ id: 1 }), m.get(objKey));

const s = new Set([1, 1, '1', NaN, NaN, {}, {}]);
console.log('C', s.size);
console.log('D', [...new Set('mississippi')].join(''));

const o = {};
o[objKey] = 'x';
console.log('E', Object.keys(o)[0]);

console.log('F', JSON.stringify(new Map([['a', 1]])), JSON.stringify([...new Map([['a', 1]])]));

const it = [10, 20][Symbol.iterator]();
console.log('G', JSON.stringify(it.next()), JSON.stringify(it.next()), JSON.stringify(it.next()));

const counts = new Map();
for (const w of 'a b a c b a'.split(' ')) counts.set(w, (counts.get(w) ?? 0) + 1);
console.log('H', [...counts].map(([k, v]) => k + v).join(','));

const ws = new WeakSet();
show('I', () => ws.add(1));
console.log(
  'J',
  Object.fromEntries(
    new Map([
      ['x', 1],
      ['y', 2],
    ]),
  ).y,
);
