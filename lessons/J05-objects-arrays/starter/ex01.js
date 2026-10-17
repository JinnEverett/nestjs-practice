// J05 · ex01 — ĐỌC, ĐỪNG CHẠY. Đoán output rồi ghi vào answers/ex01.txt
const a = { n: 1 };
const b = a;
b.n = 2;
console.log('A', a.n);
console.log('B', { n: 1 } === { n: 1 }, a === b);

const orig = { name: 'An', tags: ['x'], addr: { city: 'HN' } };
const copy = { ...orig };
copy.name = 'Bình';
copy.tags.push('y');
copy.addr = { city: 'SG' };
console.log('C', orig.name, orig.tags.length, orig.addr.city);

function rename(u) {
  u = { name: 'Mới' };
  return u.name;
}
function mutate(u) {
  u.name = 'Đổi';
}
const u = { name: 'Gốc' };
rename(u);
console.log('D', u.name);
mutate(u);
console.log('E', u.name);

const d = { at: new Date(0), skip: undefined, n: NaN };
const viaJson = JSON.parse(JSON.stringify(d));
console.log('F', typeof viaJson.at, 'skip' in viaJson, viaJson.n);
const viaClone = structuredClone(d);
console.log('G', viaClone.at instanceof Date, 'skip' in viaClone, viaClone.n);

const arr = [1, 2, 3];
const arr2 = arr;
arr2.length = 0;
console.log('H', arr.length);

const frozen = Object.freeze({ inner: { v: 1 } });
frozen.inner.v = 2;
console.log('I', frozen.inner.v);
