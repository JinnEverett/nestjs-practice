// J03 · ex03 — ĐỌC, ĐỪNG CHẠY. Đoán output rồi ghi vào answers/ex03.txt
function makeCounter() {
  let count = 0;
  return () => ++count;
}
const c1 = makeCounter();
const c2 = makeCounter();
c1();
c1();
console.log('A', c1(), c2());

const adders = [];
for (let i = 1; i <= 3; i++) adders.push((x) => x + i);
console.log('B', adders.map((f) => f(10)).join(','));

let base = 1;
const addBase = (x) => x + base;
base = 100;
console.log('C', addBase(1));

function greet(name = 'khách', msg = `Chào ${name}`) {
  return msg;
}
console.log('D', greet(), greet('An'), greet(undefined, 'Hi'));

function f(a, b = 2, ...rest) {}
console.log('E', f.length);

const square = function fact(n) {
  return n <= 1 ? 1 : n * fact(n - 1);
};
console.log('F', square(5), typeof fact);

const counter = (() => {
  let n = 0;
  return {
    inc: () => ++n,
    get value() {
      return n;
    },
  };
})();
counter.inc();
counter.inc();
console.log('G', counter.value, counter.n);

let x = 'outer';
function readX() {
  return x;
}
function run() {
  let x = 'inner';
  return readX();
}
console.log('H', run());
