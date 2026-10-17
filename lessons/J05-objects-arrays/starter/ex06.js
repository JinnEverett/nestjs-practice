// J05 · ex06 — ĐỌC, ĐỪNG CHẠY. Đoán output rồi ghi vào answers/ex06.txt
const defaults = { page: 1, limit: 20, sort: 'id' };
const query = { limit: 50, sort: undefined };
console.log('A', JSON.stringify({ ...defaults, ...query }));
console.log('B', JSON.stringify({ ...query, ...defaults }));

const { page = 1, limit = 10 } = { page: null, limit: undefined };
console.log('C', page, limit);

const [first, , third = 'z', ...rest] = ['a', 'b', undefined, 'd', 'e'];
console.log('D', first, third, rest.length);

const { a: { b: deep } = {} } = {};
console.log('E', deep);

console.log('F', 'hi👋'.length, [...'hi👋'].length);

const o = {
  get now() {
    return 'computed';
  },
};
const spread = { ...o };
console.log('G', Object.getOwnPropertyDescriptor(spread, 'now').value);

const { length } = 'hello';
console.log('H', length);

const merged = Object.assign({}, { x: 1 }, null, { y: 2 });
console.log('I', Object.keys(merged).join(','));
