// J08 · ex10 — ĐỌC, ĐỪNG CHẠY. Đoán output rồi ghi vào answers/ex10.txt
const show = (label, fn) => {
  try {
    console.log(label, fn());
  } catch (e) {
    console.log(label, e.name);
  }
};

class Base {
  greeting = 'xin chào';
  constructor() {
    console.log('A', this.describe());
  }
  describe() {
    return 'base ' + this.greeting;
  }
}
class Child extends Base {
  name = 'con';
  constructor() {
    super();
    console.log('B', this.describe());
  }
  describe() {
    return 'child ' + this.name;
  }
}
new Child();

class Counter {
  static count = 0;
  static {
    Counter.count = 10;
  }
  id = ++Counter.count;
}
new Counter();
const c2 = new Counter();
console.log('C', c2.id, Counter.count);

class P {
  x = 1;
  getX() {
    return this.x;
  }
}
class Q extends P {
  x = 2;
}
console.log('D', new Q().getX());

class R {
  static who() {
    return 'R';
  }
  static call() {
    return this.who();
  }
}
class S extends R {
  static who() {
    return 'S';
  }
}
console.log('E', S.call());

const registry = new Map();
class K {
  constructor() {
    registry.set('k', this);
  }
}
const k = new K();
console.log('F', registry.get('k') === k);

class G {
  get v() {
    return 'getter';
  }
}
const g = new G();
show('G', () => {
  g.v = 'x';
  return g.v;
});
console.log('H', Object.keys(new Q()).join(','));
