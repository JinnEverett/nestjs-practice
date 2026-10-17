// J12 · ex04 — ĐỌC, ĐỪNG CHẠY. Đoán output rồi ghi vào answers/ex04.txt
const a1 = require('./ex04-lib/a.cjs');
const a2 = require('./ex04-lib/a.cjs');
console.log('A', a1 === a2, a1.hits());

const b = require('./ex04-lib/b.cjs');
console.log('B', JSON.stringify(b));

const c = require('./ex04-lib/c.cjs');
console.log('C', JSON.stringify(c));

console.log('D', typeof __dirname, typeof module.exports);

const { x } = require('./ex04-lib/circ-x.cjs');
console.log('G', x);
