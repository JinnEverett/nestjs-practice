// J14 · ex01 — ĐỌC, ĐỪNG CHẠY. Đoán output rồi ghi vào answers/ex01.txt
const show = (label, fn) => {
  try {
    console.log(label, fn());
  } catch (e) {
    console.log(label, e.name);
  }
};

const o = {};
Object.defineProperty(o, 'id', { value: 1, enumerable: false });
o.name = 'An';
console.log('A', Object.keys(o).join(','), JSON.stringify(o), o.id);
show('B', () => {
  o.id = 2;
  return o.id;
});
console.log('C', JSON.stringify(Object.getOwnPropertyDescriptor(o, 'name')));

const secret = Symbol('secret');
const u = { [secret]: 'x', visible: 1 };
console.log('D', Object.keys(u).length, JSON.stringify(u), u[secret]);
console.log('E', Reflect.ownKeys(u).length, typeof Reflect.ownKeys(u)[1]);
console.log('F', Symbol('a') === Symbol('a'), Symbol.for('a') === Symbol.for('a'));

const sealed = Object.seal({ a: 1 });
sealed.a = 2;
show('G', () => {
  sealed.b = 3;
  return 'thêm được';
});
console.log('H', sealed.a, Object.isFrozen(sealed));

const p = new Proxy({}, { get: (t, key) => `đọc ${String(key)}` });
console.log('I', p.bấtKỳ);
console.log('J', Reflect.has({ x: 1 }, 'x'), 'toString' in {}, Reflect.ownKeys({}).length);
